import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import { NESRecord, NESFilters, NESKPIs, GeoPoint, StateMetrics, FilterOptions } from '@/types/nes';

// ─── Config ───────────────────────────────────────────────────────────────────
const PARQUET_URL =
  'https://nes-analytics.s3.ap-southeast-5.amazonaws.com/data/FINAL_DATA_NES.parquet';

// ─── DuckDB singleton ─────────────────────────────────────────────────────────
class DuckDBManager {
  private static instance: DuckDBManager;
  private db: duckdb.AsyncDuckDB | null = null;
  private conn: duckdb.AsyncDuckDBConnection | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): DuckDBManager {
    if (!DuckDBManager.instance) {
      DuckDBManager.instance = new DuckDBManager();
    }
    return DuckDBManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        console.log('Initializing DuckDB-WASM…');
        const bundles = duckdb.getJsDelivrBundles();
        const bundle = await duckdb.selectBundle(bundles);

        const workerUrl = URL.createObjectURL(
          new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' }),
        );
        const worker = new Worker(workerUrl);
        const logger = new duckdb.ConsoleLogger();
        this.db = new duckdb.AsyncDuckDB(logger, worker);
        await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);
        URL.revokeObjectURL(workerUrl);

        this.conn = await this.db.connect();

        // ── Enable HTTP client so DuckDB can fetch S3 URLs directly ──────────
        await this.conn.query(`
          INSTALL httpfs;
          LOAD httpfs;
          SET force_download=true;
        `);

        this.initialized = true;
        console.log('DuckDB-WASM ready');
      } catch (err) {
        this.initPromise = null;
        throw err;
      }
    })();

    return this.initPromise;
  }

  getDB(): duckdb.AsyncDuckDB {
    if (!this.db) throw new Error('DuckDB not initialized');
    return this.db;
  }

  async getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
    if (!this.initialized) await this.initialize();
    if (!this.conn) throw new Error('DuckDB connection not available');
    return this.conn;
  }

  async query<T = any>(sql: string): Promise<T[]> {
    const conn = await this.getConnection();
    const result = await conn.query(sql);
    return result.toArray().map(row => {
  const obj = row.toJSON() as any;

  // Convert all BigInt fields to Number
  for (const key in obj) {
    if (typeof obj[key] === 'bigint') {
      obj[key] = Number(obj[key]);
    }
  }

  return obj as T;
});
  }

  async execute(sql: string): Promise<void> {
    const conn = await this.getConnection();
    await conn.query(sql);
  }

  async tableExists(name: string): Promise<boolean> {
    try {
      const rows = await this.query<{ count: number }>(
        `SELECT COUNT(*) as count FROM information_schema.tables
         WHERE table_name = '${name}'`,
      );
      return rows.length > 0 && rows[0].count > 0;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.conn) { await this.conn.close(); this.conn = null; }
    if (this.db)   { await this.db.terminate(); this.db = null; }
    this.initialized = false;
    this.initPromise = null;
  }
}

// ─── SQL helpers ──────────────────────────────────────────────────────────────
function escapeSQLString(str: string): string {
  return str.replace(/'/g, "''");
}

function buildWhereClause(filters: NESFilters): string {
  const cond: string[] = [];

  const multi = (col: string, vals: string[]) => {
    if (!vals.length || (vals.length === 1 && vals[0] === 'All')) return;
    const list = vals.map(v => `'${escapeSQLString(v)}'`).join(', ');
    cond.push(`${col} IN (${list})`);
  };

  multi('state_name',        filters.state);
  // multi('region_name',       filters.region);
  multi('category_name',     filters.category);
  multi('program_name',      filters.program);
  multi('organization_name', filters.organization);
  multi('sso_name',          filters.sso);
  multi('membership_status', filters.membershipStatus);
  multi('target_status',     filters.targetStatus);
  multi('time_of_day',       filters.timeOfDay);
  multi('age_group',         filters.ageGroup);
  multi('event_quarter',     filters.quarter);
  multi('event_month_name',  filters.month);

  if (filters.year.length && !(filters.year.length === 1 && filters.year[0] === 'All')) {
    cond.push(`event_year IN (${filters.year.join(', ')})`);
  }
  if (filters.dateStart) cond.push(`parsed_event_date >= '${escapeSQLString(filters.dateStart)}'`);
  if (filters.dateEnd)   cond.push(`parsed_event_date <= '${escapeSQLString(filters.dateEnd)}'`);

  return cond.length ? `WHERE ${cond.join(' AND ')}` : '';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useNESData() {
  const dbManager = useRef<DuckDBManager>(DuckDBManager.getInstance());

  const [filteredData,    setFilteredData]    = useState<NESRecord[]>([]);
  const [isLoading,       setIsLoading]       = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage,    setLoadingStage]    = useState<
    'initializing' | 'checking' | 'downloading' | 'loading-db' | 'ready'
  >('initializing');
  const [error,           setError]           = useState<string | null>(null);
  const [lastRefresh,     setLastRefresh]     = useState<Date>(new Date());
  const [dataLoaded,      setDataLoaded]      = useState(false);
  const [recordCount,     setRecordCount]     = useState(0);
  const [filterOptions,   setFilterOptions]   = useState<FilterOptions>({
    state: [], region: [], category: [], program: [], organization: [],
    sso: [], membershipStatus: [], targetStatus: [], timeOfDay: [],
    ageGroup: [], quarter: [], month: [], year: [],
  });
  const [availableYears,  setAvailableYears]  = useState<string[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  const [filters, setFilters] = useState<NESFilters>({
    state: ['All'], region: ['All'], category: ['All'], program: ['All'],
    organization: ['All'], sso: ['All'], membershipStatus: ['All'],
    targetStatus: ['All'], timeOfDay: ['All'], ageGroup: ['All'],
    quarter: ['All'], dateStart: '', dateEnd: '', year: ['All'], month: ['All'],
  });

  // ── Load filter options ───────────────────────────────────────────────────
  const loadFilterOptions = useCallback(async () => {
    const db = dbManager.current;

    const distinct = async (col: string, orderBy = col, extra = '') => {
      const rows = await db.query<{ value: string | number }>(
        `SELECT DISTINCT ${col} as value FROM nes_data
         WHERE ${col} IS NOT NULL AND CAST(${col} AS VARCHAR) != ''
         ${extra}
         ORDER BY ${orderBy}`,
      );
      return rows.map(r => ({ value: String(r.value), label: String(r.value) }));
    };

    const [
      state, region, category, program, organization, sso,
      membershipStatus, targetStatus, timeOfDay, ageGroup, quarter, month,
    ] = await Promise.all([
      distinct('state_name',       'state_name',       "AND state_name NOT IN ('?','Unknown')"),
      // distinct('region_name'),
      distinct('category_name'),
      distinct('program_name'),
      distinct('organization_name'),
      distinct('sso_name'),
      distinct('membership_status'),
      distinct('target_status'),
      distinct('time_of_day'),
      distinct('age_group'),
      distinct('event_quarter'),
      distinct('event_month_name', 'event_month'),
    ]);

    const years = await db.query<{ value: number }>(
      `SELECT DISTINCT event_year as value FROM nes_data
       WHERE event_year IS NOT NULL ORDER BY event_year DESC`,
    );
    const yearOptions = years.map(y => ({ value: String(y.value), label: String(y.value) }));

    setFilterOptions({
      state, region: [], category, program, organization, sso,
      membershipStatus, targetStatus, timeOfDay, ageGroup, quarter, month,
      year: yearOptions,
    });
    setAvailableYears(yearOptions.map(y => y.value));
    setAvailableMonths(month.map(m => m.value));
  }, []);

  // ── Apply filters ─────────────────────────────────────────────────────────
  const applyFilters = useCallback(async (currentFilters: NESFilters) => {
    if (!dataLoaded) return;
    try {
      const where = buildWhereClause(currentFilters);
      const rows = await dbManager.current.query<NESRecord>(`
        SELECT * FROM nes_data
        ${where}
        ORDER BY parsed_event_date DESC, event_id
        LIMIT 2000
      `);
      setFilteredData(rows);
    } catch (err) {
      console.error('applyFilters error', err);
    }
  }, [dataLoaded]);

  // ── Core loader ───────────────────────────────────────────────────────────
  /**
   * KEY CHANGE: Instead of fetching Parquet into a JS ArrayBuffer (OOM),
   * we let DuckDB's httpfs extension fetch the S3 URL directly inside WASM.
   * Memory stays inside the WASM heap which is managed separately and can
   * spill to disk via DuckDB's buffer manager.
   */
  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setLoadingProgress(0);
      setError(null);

      // 1. Init DuckDB + httpfs
      setLoadingStage('initializing');
      setLoadingProgress(5);
      const db = dbManager.current;
      await db.initialize();

      // 2. Check if table already exists in this session
      setLoadingStage('checking');
      setLoadingProgress(15);

      const exists = await db.tableExists('nes_data');
      if (!forceRefresh && exists) {
        console.log('nes_data already in DuckDB — skipping download');
        const [{ total }] = await db.query<{ total: number }>(
          'SELECT COUNT(*) as total FROM nes_data',
        );
        setRecordCount(total);
        setDataLoaded(true);
        await loadFilterOptions();
        setLoadingStage('ready');
        setLoadingProgress(100);
        setIsLoading(false);
        return;
      }

      // 3. Stream Parquet directly from S3 into DuckDB — zero JS ArrayBuffer
      setLoadingStage('downloading');
      setLoadingProgress(20);

      if (forceRefresh) {
        await db.execute('DROP TABLE IF EXISTS nes_data');
      }

      // Fake progress ticks while DuckDB streams internally
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => Math.min(prev + 2, 85));
      }, 800);

      try {
        setLoadingStage('loading-db');
        // DuckDB httpfs streams the Parquet from S3, column-by-column.
        // No JS heap allocation for the raw bytes — prevents OOM.
        await db.execute(`
          CREATE TABLE nes_data AS
          SELECT * FROM read_parquet('${PARQUET_URL}')
        `);
      } finally {
        clearInterval(progressInterval);
      }

      // 4. Indexes
      setLoadingProgress(88);
      const indexes: [string, string][] = [
        ['idx_state',      'state_name'],
        // ['idx_region',     'region_name'],
        ['idx_category',   'category_name'],
        ['idx_program',    'program_name'],
        ['idx_year',       'event_year'],
        ['idx_date',       'parsed_event_date'],
        ['idx_membership', 'membership_status'],
        ['idx_org',        'organization_name'],
        ['idx_sso',        'sso_name'],
      ];
      for (const [name, col] of indexes) {
        await db.execute(
          `CREATE INDEX IF NOT EXISTS ${name} ON nes_data(${col})`,
        );
      }

      const [{ total }] = await db.query<{ total: number }>(
        'SELECT COUNT(*) as total FROM nes_data',
      );
      console.log(`Loaded ${total.toLocaleString()} records`);
      setRecordCount(total);
      setDataLoaded(true);

      // 5. Filter options + initial filtered data
      setLoadingProgress(94);
      await loadFilterOptions();
      setLoadingStage('ready');
      setLoadingProgress(100);
      setLastRefresh(new Date());

    } catch (err) {
      console.error('fetchData error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [loadFilterOptions]);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchData();
    return () => { dbManager.current.close(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (dataLoaded) applyFilters(filters);
  }, [filters, dataLoaded, applyFilters]);

  // ── Public query API ──────────────────────────────────────────────────────
  const refreshData = useCallback(() => fetchData(true), [fetchData]);

  const clearCache = useCallback(async () => {
    await dbManager.current.execute('DROP TABLE IF EXISTS nes_data');
    setDataLoaded(false);
    setRecordCount(0);
    setFilteredData([]);
    setFilterOptions({
      state:[], region:[], category:[], program:[], organization:[],
      sso:[], membershipStatus:[], targetStatus:[], timeOfDay:[],
      ageGroup:[], quarter:[], month:[], year:[],
    });
    setAvailableYears([]);
    setAvailableMonths([]);
    await fetchData(true);
  }, [fetchData]);

  const queryData = useCallback(async (
    limit?: number,
    offset?: number,
  ): Promise<NESRecord[]> => {
    if (!dataLoaded) return [];
    const where  = buildWhereClause(filters);
    const limitC = limit  ? `LIMIT ${limit}`   : '';
    const offC   = offset ? `OFFSET ${offset}` : '';
    return dbManager.current.query<NESRecord>(
      `SELECT * FROM nes_data ${where}
       ORDER BY parsed_event_date DESC, event_id ${limitC} ${offC}`,
    );
  }, [dataLoaded, filters]);

  const getFilteredCount = useCallback(async (): Promise<number> => {
    if (!dataLoaded) return 0;
    try {
      const [{ total }] = await dbManager.current.query<{ total: number }>(
        `SELECT COUNT(*) as total FROM nes_data ${buildWhereClause(filters)}`,
      );
      return total;
    } catch { return 0; }
  }, [dataLoaded, filters]);

  const calculateKPIs = useCallback(async (): Promise<NESKPIs> => {
    const empty: NESKPIs = {
      totalParticipants:0, uniqueMembers:0, totalEvents:0, totalNadi:0,
      avgAttendanceRate:0, avgTargetAchievement:0, totalNewMembers:0,
      avgParticipantAge:0, malePercent:0, femalePercent:0,
    };
    if (!dataLoaded) return empty;
    try {
      const [r] = await dbManager.current.query<any>(`
        SELECT
          COUNT(DISTINCT participant_id)    AS totalParticipants,
          COUNT(DISTINCT member_id)         AS uniqueMembers,
          COUNT(DISTINCT event_id)          AS totalEvents,
          COUNT(DISTINCT nadi_name)         AS totalNadi,
          COALESCE(AVG(attendance_rate_percent), 0)    AS avgAttendanceRate,
          COALESCE(AVG(target_achievement_percent), 0) AS avgTargetAchievement,
          COALESCE(SUM(total_new_member), 0)           AS totalNewMembers,
          COALESCE(AVG(avg_participant_age), 0)        AS avgParticipantAge,
          COALESCE(
            SUM(male_count)*100.0 / NULLIF(SUM(male_count+female_count),0), 0
          ) AS malePercent,
          COALESCE(
            SUM(female_count)*100.0 / NULLIF(SUM(male_count+female_count),0), 0
          ) AS femalePercent
        FROM nes_data
        ${buildWhereClause(filters)}
      `);
      return {
        totalParticipants:    r.totalParticipants    ?? 0,
        uniqueMembers:        r.uniqueMembers        ?? 0,
        totalEvents:          r.totalEvents          ?? 0,
        totalNadi:            r.totalNadi            ?? 0,
        avgAttendanceRate:    +parseFloat(r.avgAttendanceRate    ?? 0).toFixed(1),
        avgTargetAchievement: +parseFloat(r.avgTargetAchievement ?? 0).toFixed(1),
        totalNewMembers:      Math.round(r.totalNewMembers        ?? 0),
        avgParticipantAge:    +parseFloat(r.avgParticipantAge    ?? 0).toFixed(1),
        malePercent:          +parseFloat(r.malePercent          ?? 0).toFixed(1),
        femalePercent:        +parseFloat(r.femalePercent        ?? 0).toFixed(1),
      };
    } catch (err) {
      console.error('calculateKPIs error', err);
      return empty;
    }
  }, [dataLoaded, filters]);

  const getStateMetrics = useCallback(async (): Promise<StateMetrics[]> => {
    if (!dataLoaded) return [];
    const where = buildWhereClause(filters);
    const extra = `state_name IS NOT NULL AND state_name NOT IN ('','?','Unknown')`;
    const combined = where ? `${where} AND ${extra}` : `WHERE ${extra}`;
    return dbManager.current.query<StateMetrics>(`
      SELECT
        state_name                              AS state,
        COALESCE(state_code,'')                 AS stateCode,
        COUNT(DISTINCT participant_id)          AS participants,
        COUNT(DISTINCT event_id)                AS events,
        COUNT(DISTINCT nadi_name)               AS nadiCount,
        COALESCE(AVG(attendance_rate_percent),0) AS avgAttendance
      FROM nes_data
      ${combined}
      GROUP BY state_name, state_code
      ORDER BY participants DESC
    `);
  }, [dataLoaded, filters]);

  const getGeoPoints = useCallback(async (limit = 500): Promise<GeoPoint[]> => {
    if (!dataLoaded) return [];
    const where = buildWhereClause(filters);
    const extra = `latitude IS NOT NULL AND longitude IS NOT NULL
                   AND latitude != 0 AND longitude != 0`;
    const combined = where ? `${where} AND ${extra}` : `WHERE ${extra}`;
    return dbManager.current.query<GeoPoint>(`
      SELECT
        latitude  AS lat,
        longitude AS lng,
        COALESCE(nadi_name, site_name, 'Unknown') AS name,
        COUNT(DISTINCT participant_id) AS participants,
        COUNT(DISTINCT event_id)       AS events,
        COALESCE(state_name,'')        AS state
      FROM nes_data
      ${combined}
      GROUP BY latitude, longitude, nadi_name, site_name, state_name
      LIMIT ${limit}
    `);
  }, [dataLoaded, filters]);

  const executeQuery = useCallback(async <T = any>(sql: string): Promise<T[]> => {
    if (!dataLoaded) return [];
    return dbManager.current.query<T>(sql);
  }, [dataLoaded]);

  // ── Filter helpers ────────────────────────────────────────────────────────
  const updateFilter = useCallback((key: keyof NESFilters, value: string | string[]) => {
    setFilters(prev => {
      if (key === 'dateStart' || key === 'dateEnd') {
        return { ...prev, [key]: value as string };
      }
      if (Array.isArray(value)) return { ...prev, [key]: value };

      const curr = prev[key] as string[];
      if (value === 'All') return { ...prev, [key]: ['All'] };
      if (curr.includes(value)) {
        const next = curr.filter(v => v !== value);
        return { ...prev, [key]: next.length ? next : ['All'] };
      }
      return { ...prev, [key]: [...curr.filter(v => v !== 'All'), value] };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      state:['All'], region:['All'], category:['All'], program:['All'],
      organization:['All'], sso:['All'], membershipStatus:['All'],
      targetStatus:['All'], timeOfDay:['All'], ageGroup:['All'],
      quarter:['All'], dateStart:'', dateEnd:'', year:['All'], month:['All'],
    });
  }, []);

  const activeFilterCount = useMemo(() => {
    const keys: (keyof NESFilters)[] = [
      'state','region','category','program','organization','sso',
      'membershipStatus','targetStatus','timeOfDay','ageGroup','quarter','year','month',
    ];
    let n = keys.filter(k => {
      const v = filters[k] as string[];
      return v.length > 0 && !(v.length === 1 && v[0] === 'All');
    }).length;
    if (filters.dateStart || filters.dateEnd) n++;
    return n;
  }, [filters]);

  const kpis: NESKPIs = useMemo(() => ({
    totalParticipants:0, uniqueMembers:0, totalEvents:0, totalNadi:0,
    avgAttendanceRate:0, avgTargetAchievement:0, totalNewMembers:0,
    avgParticipantAge:0, malePercent:0, femalePercent:0,
  }), []);

  return {
    allData: filteredData,
    filteredData,
    isLoading,
    loadingProgress,
    loadingStage,
    error,
    lastRefresh,
    dataLoaded,
    recordCount,
    filters,
    filterOptions,
    availableYears,
    availableMonths,
    activeFilterCount,
    updateFilter,
    resetFilters,
    kpis,
    geoPoints: [] as GeoPoint[],
    stateMetrics: [] as StateMetrics[],
    queryData,
    getFilteredCount,
    calculateKPIs,
    getStateMetrics,
    getGeoPoints,
    executeQuery,
    refreshData,
    clearCache,
  };
}
