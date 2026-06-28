
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Fixture
 * 
 */
export type Fixture = $Result.DefaultSelection<Prisma.$FixturePayload>
/**
 * Model MatchStatistics
 * 
 */
export type MatchStatistics = $Result.DefaultSelection<Prisma.$MatchStatisticsPayload>
/**
 * Model H2HRecord
 * 
 */
export type H2HRecord = $Result.DefaultSelection<Prisma.$H2HRecordPayload>
/**
 * Model TeamStrength
 * 
 */
export type TeamStrength = $Result.DefaultSelection<Prisma.$TeamStrengthPayload>
/**
 * Model ConfidenceScore
 * 
 */
export type ConfidenceScore = $Result.DefaultSelection<Prisma.$ConfidenceScorePayload>
/**
 * Model MarketRule
 * 
 */
export type MarketRule = $Result.DefaultSelection<Prisma.$MarketRulePayload>
/**
 * Model ValueBetScan
 * 
 */
export type ValueBetScan = $Result.DefaultSelection<Prisma.$ValueBetScanPayload>
/**
 * Model SlipAnalysisLog
 * 
 */
export type SlipAnalysisLog = $Result.DefaultSelection<Prisma.$SlipAnalysisLogPayload>
/**
 * Model AccumulatorBuild
 * 
 */
export type AccumulatorBuild = $Result.DefaultSelection<Prisma.$AccumulatorBuildPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const FixtureStatus: {
  UPCOMING: 'UPCOMING',
  LIVE: 'LIVE',
  FINISHED: 'FINISHED',
  POSTPONED: 'POSTPONED',
  CANCELLED: 'CANCELLED'
};

export type FixtureStatus = (typeof FixtureStatus)[keyof typeof FixtureStatus]


export const RiskLevel: {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
};

export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel]


export const MarketRisk: {
  SAFE: 'SAFE',
  MEDIUM: 'MEDIUM',
  HIGH_VOLATILITY: 'HIGH_VOLATILITY',
  CUSTOM: 'CUSTOM'
};

export type MarketRisk = (typeof MarketRisk)[keyof typeof MarketRisk]

}

export type FixtureStatus = $Enums.FixtureStatus

export const FixtureStatus: typeof $Enums.FixtureStatus

export type RiskLevel = $Enums.RiskLevel

export const RiskLevel: typeof $Enums.RiskLevel

export type MarketRisk = $Enums.MarketRisk

export const MarketRisk: typeof $Enums.MarketRisk

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Fixtures
 * const fixtures = await prisma.fixture.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Fixtures
   * const fixtures = await prisma.fixture.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.fixture`: Exposes CRUD operations for the **Fixture** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Fixtures
    * const fixtures = await prisma.fixture.findMany()
    * ```
    */
  get fixture(): Prisma.FixtureDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.matchStatistics`: Exposes CRUD operations for the **MatchStatistics** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MatchStatistics
    * const matchStatistics = await prisma.matchStatistics.findMany()
    * ```
    */
  get matchStatistics(): Prisma.MatchStatisticsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.h2HRecord`: Exposes CRUD operations for the **H2HRecord** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more H2HRecords
    * const h2HRecords = await prisma.h2HRecord.findMany()
    * ```
    */
  get h2HRecord(): Prisma.H2HRecordDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.teamStrength`: Exposes CRUD operations for the **TeamStrength** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TeamStrengths
    * const teamStrengths = await prisma.teamStrength.findMany()
    * ```
    */
  get teamStrength(): Prisma.TeamStrengthDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.confidenceScore`: Exposes CRUD operations for the **ConfidenceScore** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ConfidenceScores
    * const confidenceScores = await prisma.confidenceScore.findMany()
    * ```
    */
  get confidenceScore(): Prisma.ConfidenceScoreDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.marketRule`: Exposes CRUD operations for the **MarketRule** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MarketRules
    * const marketRules = await prisma.marketRule.findMany()
    * ```
    */
  get marketRule(): Prisma.MarketRuleDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.valueBetScan`: Exposes CRUD operations for the **ValueBetScan** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ValueBetScans
    * const valueBetScans = await prisma.valueBetScan.findMany()
    * ```
    */
  get valueBetScan(): Prisma.ValueBetScanDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.slipAnalysisLog`: Exposes CRUD operations for the **SlipAnalysisLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SlipAnalysisLogs
    * const slipAnalysisLogs = await prisma.slipAnalysisLog.findMany()
    * ```
    */
  get slipAnalysisLog(): Prisma.SlipAnalysisLogDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.accumulatorBuild`: Exposes CRUD operations for the **AccumulatorBuild** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AccumulatorBuilds
    * const accumulatorBuilds = await prisma.accumulatorBuild.findMany()
    * ```
    */
  get accumulatorBuild(): Prisma.AccumulatorBuildDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.8.0
   * Query Engine version: 3c6e192761c0362d496ed980de936e2f3cebcd3a
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Fixture: 'Fixture',
    MatchStatistics: 'MatchStatistics',
    H2HRecord: 'H2HRecord',
    TeamStrength: 'TeamStrength',
    ConfidenceScore: 'ConfidenceScore',
    MarketRule: 'MarketRule',
    ValueBetScan: 'ValueBetScan',
    SlipAnalysisLog: 'SlipAnalysisLog',
    AccumulatorBuild: 'AccumulatorBuild'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "fixture" | "matchStatistics" | "h2HRecord" | "teamStrength" | "confidenceScore" | "marketRule" | "valueBetScan" | "slipAnalysisLog" | "accumulatorBuild"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Fixture: {
        payload: Prisma.$FixturePayload<ExtArgs>
        fields: Prisma.FixtureFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FixtureFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixturePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FixtureFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixturePayload>
          }
          findFirst: {
            args: Prisma.FixtureFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixturePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FixtureFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixturePayload>
          }
          findMany: {
            args: Prisma.FixtureFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixturePayload>[]
          }
          create: {
            args: Prisma.FixtureCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixturePayload>
          }
          createMany: {
            args: Prisma.FixtureCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FixtureCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixturePayload>[]
          }
          delete: {
            args: Prisma.FixtureDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixturePayload>
          }
          update: {
            args: Prisma.FixtureUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixturePayload>
          }
          deleteMany: {
            args: Prisma.FixtureDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FixtureUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.FixtureUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixturePayload>[]
          }
          upsert: {
            args: Prisma.FixtureUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FixturePayload>
          }
          aggregate: {
            args: Prisma.FixtureAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFixture>
          }
          groupBy: {
            args: Prisma.FixtureGroupByArgs<ExtArgs>
            result: $Utils.Optional<FixtureGroupByOutputType>[]
          }
          count: {
            args: Prisma.FixtureCountArgs<ExtArgs>
            result: $Utils.Optional<FixtureCountAggregateOutputType> | number
          }
        }
      }
      MatchStatistics: {
        payload: Prisma.$MatchStatisticsPayload<ExtArgs>
        fields: Prisma.MatchStatisticsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MatchStatisticsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchStatisticsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MatchStatisticsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchStatisticsPayload>
          }
          findFirst: {
            args: Prisma.MatchStatisticsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchStatisticsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MatchStatisticsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchStatisticsPayload>
          }
          findMany: {
            args: Prisma.MatchStatisticsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchStatisticsPayload>[]
          }
          create: {
            args: Prisma.MatchStatisticsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchStatisticsPayload>
          }
          createMany: {
            args: Prisma.MatchStatisticsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MatchStatisticsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchStatisticsPayload>[]
          }
          delete: {
            args: Prisma.MatchStatisticsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchStatisticsPayload>
          }
          update: {
            args: Prisma.MatchStatisticsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchStatisticsPayload>
          }
          deleteMany: {
            args: Prisma.MatchStatisticsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MatchStatisticsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MatchStatisticsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchStatisticsPayload>[]
          }
          upsert: {
            args: Prisma.MatchStatisticsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MatchStatisticsPayload>
          }
          aggregate: {
            args: Prisma.MatchStatisticsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMatchStatistics>
          }
          groupBy: {
            args: Prisma.MatchStatisticsGroupByArgs<ExtArgs>
            result: $Utils.Optional<MatchStatisticsGroupByOutputType>[]
          }
          count: {
            args: Prisma.MatchStatisticsCountArgs<ExtArgs>
            result: $Utils.Optional<MatchStatisticsCountAggregateOutputType> | number
          }
        }
      }
      H2HRecord: {
        payload: Prisma.$H2HRecordPayload<ExtArgs>
        fields: Prisma.H2HRecordFieldRefs
        operations: {
          findUnique: {
            args: Prisma.H2HRecordFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$H2HRecordPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.H2HRecordFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$H2HRecordPayload>
          }
          findFirst: {
            args: Prisma.H2HRecordFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$H2HRecordPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.H2HRecordFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$H2HRecordPayload>
          }
          findMany: {
            args: Prisma.H2HRecordFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$H2HRecordPayload>[]
          }
          create: {
            args: Prisma.H2HRecordCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$H2HRecordPayload>
          }
          createMany: {
            args: Prisma.H2HRecordCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.H2HRecordCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$H2HRecordPayload>[]
          }
          delete: {
            args: Prisma.H2HRecordDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$H2HRecordPayload>
          }
          update: {
            args: Prisma.H2HRecordUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$H2HRecordPayload>
          }
          deleteMany: {
            args: Prisma.H2HRecordDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.H2HRecordUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.H2HRecordUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$H2HRecordPayload>[]
          }
          upsert: {
            args: Prisma.H2HRecordUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$H2HRecordPayload>
          }
          aggregate: {
            args: Prisma.H2HRecordAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateH2HRecord>
          }
          groupBy: {
            args: Prisma.H2HRecordGroupByArgs<ExtArgs>
            result: $Utils.Optional<H2HRecordGroupByOutputType>[]
          }
          count: {
            args: Prisma.H2HRecordCountArgs<ExtArgs>
            result: $Utils.Optional<H2HRecordCountAggregateOutputType> | number
          }
        }
      }
      TeamStrength: {
        payload: Prisma.$TeamStrengthPayload<ExtArgs>
        fields: Prisma.TeamStrengthFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TeamStrengthFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamStrengthPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TeamStrengthFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamStrengthPayload>
          }
          findFirst: {
            args: Prisma.TeamStrengthFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamStrengthPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TeamStrengthFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamStrengthPayload>
          }
          findMany: {
            args: Prisma.TeamStrengthFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamStrengthPayload>[]
          }
          create: {
            args: Prisma.TeamStrengthCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamStrengthPayload>
          }
          createMany: {
            args: Prisma.TeamStrengthCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TeamStrengthCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamStrengthPayload>[]
          }
          delete: {
            args: Prisma.TeamStrengthDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamStrengthPayload>
          }
          update: {
            args: Prisma.TeamStrengthUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamStrengthPayload>
          }
          deleteMany: {
            args: Prisma.TeamStrengthDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TeamStrengthUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TeamStrengthUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamStrengthPayload>[]
          }
          upsert: {
            args: Prisma.TeamStrengthUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamStrengthPayload>
          }
          aggregate: {
            args: Prisma.TeamStrengthAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTeamStrength>
          }
          groupBy: {
            args: Prisma.TeamStrengthGroupByArgs<ExtArgs>
            result: $Utils.Optional<TeamStrengthGroupByOutputType>[]
          }
          count: {
            args: Prisma.TeamStrengthCountArgs<ExtArgs>
            result: $Utils.Optional<TeamStrengthCountAggregateOutputType> | number
          }
        }
      }
      ConfidenceScore: {
        payload: Prisma.$ConfidenceScorePayload<ExtArgs>
        fields: Prisma.ConfidenceScoreFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ConfidenceScoreFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfidenceScorePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ConfidenceScoreFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfidenceScorePayload>
          }
          findFirst: {
            args: Prisma.ConfidenceScoreFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfidenceScorePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ConfidenceScoreFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfidenceScorePayload>
          }
          findMany: {
            args: Prisma.ConfidenceScoreFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfidenceScorePayload>[]
          }
          create: {
            args: Prisma.ConfidenceScoreCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfidenceScorePayload>
          }
          createMany: {
            args: Prisma.ConfidenceScoreCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ConfidenceScoreCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfidenceScorePayload>[]
          }
          delete: {
            args: Prisma.ConfidenceScoreDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfidenceScorePayload>
          }
          update: {
            args: Prisma.ConfidenceScoreUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfidenceScorePayload>
          }
          deleteMany: {
            args: Prisma.ConfidenceScoreDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ConfidenceScoreUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ConfidenceScoreUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfidenceScorePayload>[]
          }
          upsert: {
            args: Prisma.ConfidenceScoreUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfidenceScorePayload>
          }
          aggregate: {
            args: Prisma.ConfidenceScoreAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateConfidenceScore>
          }
          groupBy: {
            args: Prisma.ConfidenceScoreGroupByArgs<ExtArgs>
            result: $Utils.Optional<ConfidenceScoreGroupByOutputType>[]
          }
          count: {
            args: Prisma.ConfidenceScoreCountArgs<ExtArgs>
            result: $Utils.Optional<ConfidenceScoreCountAggregateOutputType> | number
          }
        }
      }
      MarketRule: {
        payload: Prisma.$MarketRulePayload<ExtArgs>
        fields: Prisma.MarketRuleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MarketRuleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketRulePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MarketRuleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketRulePayload>
          }
          findFirst: {
            args: Prisma.MarketRuleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketRulePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MarketRuleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketRulePayload>
          }
          findMany: {
            args: Prisma.MarketRuleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketRulePayload>[]
          }
          create: {
            args: Prisma.MarketRuleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketRulePayload>
          }
          createMany: {
            args: Prisma.MarketRuleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MarketRuleCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketRulePayload>[]
          }
          delete: {
            args: Prisma.MarketRuleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketRulePayload>
          }
          update: {
            args: Prisma.MarketRuleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketRulePayload>
          }
          deleteMany: {
            args: Prisma.MarketRuleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MarketRuleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MarketRuleUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketRulePayload>[]
          }
          upsert: {
            args: Prisma.MarketRuleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketRulePayload>
          }
          aggregate: {
            args: Prisma.MarketRuleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMarketRule>
          }
          groupBy: {
            args: Prisma.MarketRuleGroupByArgs<ExtArgs>
            result: $Utils.Optional<MarketRuleGroupByOutputType>[]
          }
          count: {
            args: Prisma.MarketRuleCountArgs<ExtArgs>
            result: $Utils.Optional<MarketRuleCountAggregateOutputType> | number
          }
        }
      }
      ValueBetScan: {
        payload: Prisma.$ValueBetScanPayload<ExtArgs>
        fields: Prisma.ValueBetScanFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ValueBetScanFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ValueBetScanPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ValueBetScanFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ValueBetScanPayload>
          }
          findFirst: {
            args: Prisma.ValueBetScanFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ValueBetScanPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ValueBetScanFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ValueBetScanPayload>
          }
          findMany: {
            args: Prisma.ValueBetScanFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ValueBetScanPayload>[]
          }
          create: {
            args: Prisma.ValueBetScanCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ValueBetScanPayload>
          }
          createMany: {
            args: Prisma.ValueBetScanCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ValueBetScanCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ValueBetScanPayload>[]
          }
          delete: {
            args: Prisma.ValueBetScanDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ValueBetScanPayload>
          }
          update: {
            args: Prisma.ValueBetScanUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ValueBetScanPayload>
          }
          deleteMany: {
            args: Prisma.ValueBetScanDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ValueBetScanUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ValueBetScanUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ValueBetScanPayload>[]
          }
          upsert: {
            args: Prisma.ValueBetScanUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ValueBetScanPayload>
          }
          aggregate: {
            args: Prisma.ValueBetScanAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateValueBetScan>
          }
          groupBy: {
            args: Prisma.ValueBetScanGroupByArgs<ExtArgs>
            result: $Utils.Optional<ValueBetScanGroupByOutputType>[]
          }
          count: {
            args: Prisma.ValueBetScanCountArgs<ExtArgs>
            result: $Utils.Optional<ValueBetScanCountAggregateOutputType> | number
          }
        }
      }
      SlipAnalysisLog: {
        payload: Prisma.$SlipAnalysisLogPayload<ExtArgs>
        fields: Prisma.SlipAnalysisLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SlipAnalysisLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlipAnalysisLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SlipAnalysisLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlipAnalysisLogPayload>
          }
          findFirst: {
            args: Prisma.SlipAnalysisLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlipAnalysisLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SlipAnalysisLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlipAnalysisLogPayload>
          }
          findMany: {
            args: Prisma.SlipAnalysisLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlipAnalysisLogPayload>[]
          }
          create: {
            args: Prisma.SlipAnalysisLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlipAnalysisLogPayload>
          }
          createMany: {
            args: Prisma.SlipAnalysisLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SlipAnalysisLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlipAnalysisLogPayload>[]
          }
          delete: {
            args: Prisma.SlipAnalysisLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlipAnalysisLogPayload>
          }
          update: {
            args: Prisma.SlipAnalysisLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlipAnalysisLogPayload>
          }
          deleteMany: {
            args: Prisma.SlipAnalysisLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SlipAnalysisLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SlipAnalysisLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlipAnalysisLogPayload>[]
          }
          upsert: {
            args: Prisma.SlipAnalysisLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlipAnalysisLogPayload>
          }
          aggregate: {
            args: Prisma.SlipAnalysisLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSlipAnalysisLog>
          }
          groupBy: {
            args: Prisma.SlipAnalysisLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<SlipAnalysisLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.SlipAnalysisLogCountArgs<ExtArgs>
            result: $Utils.Optional<SlipAnalysisLogCountAggregateOutputType> | number
          }
        }
      }
      AccumulatorBuild: {
        payload: Prisma.$AccumulatorBuildPayload<ExtArgs>
        fields: Prisma.AccumulatorBuildFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AccumulatorBuildFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccumulatorBuildPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AccumulatorBuildFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccumulatorBuildPayload>
          }
          findFirst: {
            args: Prisma.AccumulatorBuildFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccumulatorBuildPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AccumulatorBuildFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccumulatorBuildPayload>
          }
          findMany: {
            args: Prisma.AccumulatorBuildFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccumulatorBuildPayload>[]
          }
          create: {
            args: Prisma.AccumulatorBuildCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccumulatorBuildPayload>
          }
          createMany: {
            args: Prisma.AccumulatorBuildCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AccumulatorBuildCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccumulatorBuildPayload>[]
          }
          delete: {
            args: Prisma.AccumulatorBuildDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccumulatorBuildPayload>
          }
          update: {
            args: Prisma.AccumulatorBuildUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccumulatorBuildPayload>
          }
          deleteMany: {
            args: Prisma.AccumulatorBuildDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AccumulatorBuildUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AccumulatorBuildUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccumulatorBuildPayload>[]
          }
          upsert: {
            args: Prisma.AccumulatorBuildUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccumulatorBuildPayload>
          }
          aggregate: {
            args: Prisma.AccumulatorBuildAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAccumulatorBuild>
          }
          groupBy: {
            args: Prisma.AccumulatorBuildGroupByArgs<ExtArgs>
            result: $Utils.Optional<AccumulatorBuildGroupByOutputType>[]
          }
          count: {
            args: Prisma.AccumulatorBuildCountArgs<ExtArgs>
            result: $Utils.Optional<AccumulatorBuildCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    fixture?: FixtureOmit
    matchStatistics?: MatchStatisticsOmit
    h2HRecord?: H2HRecordOmit
    teamStrength?: TeamStrengthOmit
    confidenceScore?: ConfidenceScoreOmit
    marketRule?: MarketRuleOmit
    valueBetScan?: ValueBetScanOmit
    slipAnalysisLog?: SlipAnalysisLogOmit
    accumulatorBuild?: AccumulatorBuildOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type FixtureCountOutputType
   */

  export type FixtureCountOutputType = {
    confidenceScores: number
    valueBetScans: number
  }

  export type FixtureCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    confidenceScores?: boolean | FixtureCountOutputTypeCountConfidenceScoresArgs
    valueBetScans?: boolean | FixtureCountOutputTypeCountValueBetScansArgs
  }

  // Custom InputTypes
  /**
   * FixtureCountOutputType without action
   */
  export type FixtureCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FixtureCountOutputType
     */
    select?: FixtureCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * FixtureCountOutputType without action
   */
  export type FixtureCountOutputTypeCountConfidenceScoresArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConfidenceScoreWhereInput
  }

  /**
   * FixtureCountOutputType without action
   */
  export type FixtureCountOutputTypeCountValueBetScansArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ValueBetScanWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Fixture
   */

  export type AggregateFixture = {
    _count: FixtureCountAggregateOutputType | null
    _avg: FixtureAvgAggregateOutputType | null
    _sum: FixtureSumAggregateOutputType | null
    _min: FixtureMinAggregateOutputType | null
    _max: FixtureMaxAggregateOutputType | null
  }

  export type FixtureAvgAggregateOutputType = {
    homeScore: number | null
    awayScore: number | null
  }

  export type FixtureSumAggregateOutputType = {
    homeScore: number | null
    awayScore: number | null
  }

  export type FixtureMinAggregateOutputType = {
    id: string | null
    fixtureId: string | null
    homeTeam: string | null
    awayTeam: string | null
    homeTeamId: string | null
    awayTeamId: string | null
    league: string | null
    leagueId: string | null
    country: string | null
    matchDate: Date | null
    status: $Enums.FixtureStatus | null
    homeScore: number | null
    awayScore: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type FixtureMaxAggregateOutputType = {
    id: string | null
    fixtureId: string | null
    homeTeam: string | null
    awayTeam: string | null
    homeTeamId: string | null
    awayTeamId: string | null
    league: string | null
    leagueId: string | null
    country: string | null
    matchDate: Date | null
    status: $Enums.FixtureStatus | null
    homeScore: number | null
    awayScore: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type FixtureCountAggregateOutputType = {
    id: number
    fixtureId: number
    homeTeam: number
    awayTeam: number
    homeTeamId: number
    awayTeamId: number
    league: number
    leagueId: number
    country: number
    matchDate: number
    status: number
    homeScore: number
    awayScore: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type FixtureAvgAggregateInputType = {
    homeScore?: true
    awayScore?: true
  }

  export type FixtureSumAggregateInputType = {
    homeScore?: true
    awayScore?: true
  }

  export type FixtureMinAggregateInputType = {
    id?: true
    fixtureId?: true
    homeTeam?: true
    awayTeam?: true
    homeTeamId?: true
    awayTeamId?: true
    league?: true
    leagueId?: true
    country?: true
    matchDate?: true
    status?: true
    homeScore?: true
    awayScore?: true
    createdAt?: true
    updatedAt?: true
  }

  export type FixtureMaxAggregateInputType = {
    id?: true
    fixtureId?: true
    homeTeam?: true
    awayTeam?: true
    homeTeamId?: true
    awayTeamId?: true
    league?: true
    leagueId?: true
    country?: true
    matchDate?: true
    status?: true
    homeScore?: true
    awayScore?: true
    createdAt?: true
    updatedAt?: true
  }

  export type FixtureCountAggregateInputType = {
    id?: true
    fixtureId?: true
    homeTeam?: true
    awayTeam?: true
    homeTeamId?: true
    awayTeamId?: true
    league?: true
    leagueId?: true
    country?: true
    matchDate?: true
    status?: true
    homeScore?: true
    awayScore?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type FixtureAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Fixture to aggregate.
     */
    where?: FixtureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Fixtures to fetch.
     */
    orderBy?: FixtureOrderByWithRelationInput | FixtureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FixtureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Fixtures from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Fixtures.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Fixtures
    **/
    _count?: true | FixtureCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: FixtureAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: FixtureSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FixtureMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FixtureMaxAggregateInputType
  }

  export type GetFixtureAggregateType<T extends FixtureAggregateArgs> = {
        [P in keyof T & keyof AggregateFixture]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFixture[P]>
      : GetScalarType<T[P], AggregateFixture[P]>
  }




  export type FixtureGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FixtureWhereInput
    orderBy?: FixtureOrderByWithAggregationInput | FixtureOrderByWithAggregationInput[]
    by: FixtureScalarFieldEnum[] | FixtureScalarFieldEnum
    having?: FixtureScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FixtureCountAggregateInputType | true
    _avg?: FixtureAvgAggregateInputType
    _sum?: FixtureSumAggregateInputType
    _min?: FixtureMinAggregateInputType
    _max?: FixtureMaxAggregateInputType
  }

  export type FixtureGroupByOutputType = {
    id: string
    fixtureId: string
    homeTeam: string
    awayTeam: string
    homeTeamId: string
    awayTeamId: string
    league: string
    leagueId: string
    country: string
    matchDate: Date
    status: $Enums.FixtureStatus
    homeScore: number | null
    awayScore: number | null
    createdAt: Date
    updatedAt: Date
    _count: FixtureCountAggregateOutputType | null
    _avg: FixtureAvgAggregateOutputType | null
    _sum: FixtureSumAggregateOutputType | null
    _min: FixtureMinAggregateOutputType | null
    _max: FixtureMaxAggregateOutputType | null
  }

  type GetFixtureGroupByPayload<T extends FixtureGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FixtureGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FixtureGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FixtureGroupByOutputType[P]>
            : GetScalarType<T[P], FixtureGroupByOutputType[P]>
        }
      >
    >


  export type FixtureSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fixtureId?: boolean
    homeTeam?: boolean
    awayTeam?: boolean
    homeTeamId?: boolean
    awayTeamId?: boolean
    league?: boolean
    leagueId?: boolean
    country?: boolean
    matchDate?: boolean
    status?: boolean
    homeScore?: boolean
    awayScore?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    statistics?: boolean | Fixture$statisticsArgs<ExtArgs>
    confidenceScores?: boolean | Fixture$confidenceScoresArgs<ExtArgs>
    valueBetScans?: boolean | Fixture$valueBetScansArgs<ExtArgs>
    _count?: boolean | FixtureCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["fixture"]>

  export type FixtureSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fixtureId?: boolean
    homeTeam?: boolean
    awayTeam?: boolean
    homeTeamId?: boolean
    awayTeamId?: boolean
    league?: boolean
    leagueId?: boolean
    country?: boolean
    matchDate?: boolean
    status?: boolean
    homeScore?: boolean
    awayScore?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["fixture"]>

  export type FixtureSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fixtureId?: boolean
    homeTeam?: boolean
    awayTeam?: boolean
    homeTeamId?: boolean
    awayTeamId?: boolean
    league?: boolean
    leagueId?: boolean
    country?: boolean
    matchDate?: boolean
    status?: boolean
    homeScore?: boolean
    awayScore?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["fixture"]>

  export type FixtureSelectScalar = {
    id?: boolean
    fixtureId?: boolean
    homeTeam?: boolean
    awayTeam?: boolean
    homeTeamId?: boolean
    awayTeamId?: boolean
    league?: boolean
    leagueId?: boolean
    country?: boolean
    matchDate?: boolean
    status?: boolean
    homeScore?: boolean
    awayScore?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type FixtureOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "fixtureId" | "homeTeam" | "awayTeam" | "homeTeamId" | "awayTeamId" | "league" | "leagueId" | "country" | "matchDate" | "status" | "homeScore" | "awayScore" | "createdAt" | "updatedAt", ExtArgs["result"]["fixture"]>
  export type FixtureInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    statistics?: boolean | Fixture$statisticsArgs<ExtArgs>
    confidenceScores?: boolean | Fixture$confidenceScoresArgs<ExtArgs>
    valueBetScans?: boolean | Fixture$valueBetScansArgs<ExtArgs>
    _count?: boolean | FixtureCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type FixtureIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type FixtureIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $FixturePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Fixture"
    objects: {
      statistics: Prisma.$MatchStatisticsPayload<ExtArgs> | null
      confidenceScores: Prisma.$ConfidenceScorePayload<ExtArgs>[]
      valueBetScans: Prisma.$ValueBetScanPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      fixtureId: string
      homeTeam: string
      awayTeam: string
      homeTeamId: string
      awayTeamId: string
      league: string
      leagueId: string
      country: string
      matchDate: Date
      status: $Enums.FixtureStatus
      homeScore: number | null
      awayScore: number | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["fixture"]>
    composites: {}
  }

  type FixtureGetPayload<S extends boolean | null | undefined | FixtureDefaultArgs> = $Result.GetResult<Prisma.$FixturePayload, S>

  type FixtureCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<FixtureFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: FixtureCountAggregateInputType | true
    }

  export interface FixtureDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Fixture'], meta: { name: 'Fixture' } }
    /**
     * Find zero or one Fixture that matches the filter.
     * @param {FixtureFindUniqueArgs} args - Arguments to find a Fixture
     * @example
     * // Get one Fixture
     * const fixture = await prisma.fixture.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FixtureFindUniqueArgs>(args: SelectSubset<T, FixtureFindUniqueArgs<ExtArgs>>): Prisma__FixtureClient<$Result.GetResult<Prisma.$FixturePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Fixture that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {FixtureFindUniqueOrThrowArgs} args - Arguments to find a Fixture
     * @example
     * // Get one Fixture
     * const fixture = await prisma.fixture.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FixtureFindUniqueOrThrowArgs>(args: SelectSubset<T, FixtureFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FixtureClient<$Result.GetResult<Prisma.$FixturePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Fixture that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FixtureFindFirstArgs} args - Arguments to find a Fixture
     * @example
     * // Get one Fixture
     * const fixture = await prisma.fixture.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FixtureFindFirstArgs>(args?: SelectSubset<T, FixtureFindFirstArgs<ExtArgs>>): Prisma__FixtureClient<$Result.GetResult<Prisma.$FixturePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Fixture that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FixtureFindFirstOrThrowArgs} args - Arguments to find a Fixture
     * @example
     * // Get one Fixture
     * const fixture = await prisma.fixture.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FixtureFindFirstOrThrowArgs>(args?: SelectSubset<T, FixtureFindFirstOrThrowArgs<ExtArgs>>): Prisma__FixtureClient<$Result.GetResult<Prisma.$FixturePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Fixtures that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FixtureFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Fixtures
     * const fixtures = await prisma.fixture.findMany()
     * 
     * // Get first 10 Fixtures
     * const fixtures = await prisma.fixture.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const fixtureWithIdOnly = await prisma.fixture.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FixtureFindManyArgs>(args?: SelectSubset<T, FixtureFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FixturePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Fixture.
     * @param {FixtureCreateArgs} args - Arguments to create a Fixture.
     * @example
     * // Create one Fixture
     * const Fixture = await prisma.fixture.create({
     *   data: {
     *     // ... data to create a Fixture
     *   }
     * })
     * 
     */
    create<T extends FixtureCreateArgs>(args: SelectSubset<T, FixtureCreateArgs<ExtArgs>>): Prisma__FixtureClient<$Result.GetResult<Prisma.$FixturePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Fixtures.
     * @param {FixtureCreateManyArgs} args - Arguments to create many Fixtures.
     * @example
     * // Create many Fixtures
     * const fixture = await prisma.fixture.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FixtureCreateManyArgs>(args?: SelectSubset<T, FixtureCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Fixtures and returns the data saved in the database.
     * @param {FixtureCreateManyAndReturnArgs} args - Arguments to create many Fixtures.
     * @example
     * // Create many Fixtures
     * const fixture = await prisma.fixture.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Fixtures and only return the `id`
     * const fixtureWithIdOnly = await prisma.fixture.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends FixtureCreateManyAndReturnArgs>(args?: SelectSubset<T, FixtureCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FixturePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Fixture.
     * @param {FixtureDeleteArgs} args - Arguments to delete one Fixture.
     * @example
     * // Delete one Fixture
     * const Fixture = await prisma.fixture.delete({
     *   where: {
     *     // ... filter to delete one Fixture
     *   }
     * })
     * 
     */
    delete<T extends FixtureDeleteArgs>(args: SelectSubset<T, FixtureDeleteArgs<ExtArgs>>): Prisma__FixtureClient<$Result.GetResult<Prisma.$FixturePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Fixture.
     * @param {FixtureUpdateArgs} args - Arguments to update one Fixture.
     * @example
     * // Update one Fixture
     * const fixture = await prisma.fixture.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FixtureUpdateArgs>(args: SelectSubset<T, FixtureUpdateArgs<ExtArgs>>): Prisma__FixtureClient<$Result.GetResult<Prisma.$FixturePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Fixtures.
     * @param {FixtureDeleteManyArgs} args - Arguments to filter Fixtures to delete.
     * @example
     * // Delete a few Fixtures
     * const { count } = await prisma.fixture.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FixtureDeleteManyArgs>(args?: SelectSubset<T, FixtureDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Fixtures.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FixtureUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Fixtures
     * const fixture = await prisma.fixture.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FixtureUpdateManyArgs>(args: SelectSubset<T, FixtureUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Fixtures and returns the data updated in the database.
     * @param {FixtureUpdateManyAndReturnArgs} args - Arguments to update many Fixtures.
     * @example
     * // Update many Fixtures
     * const fixture = await prisma.fixture.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Fixtures and only return the `id`
     * const fixtureWithIdOnly = await prisma.fixture.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends FixtureUpdateManyAndReturnArgs>(args: SelectSubset<T, FixtureUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FixturePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Fixture.
     * @param {FixtureUpsertArgs} args - Arguments to update or create a Fixture.
     * @example
     * // Update or create a Fixture
     * const fixture = await prisma.fixture.upsert({
     *   create: {
     *     // ... data to create a Fixture
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Fixture we want to update
     *   }
     * })
     */
    upsert<T extends FixtureUpsertArgs>(args: SelectSubset<T, FixtureUpsertArgs<ExtArgs>>): Prisma__FixtureClient<$Result.GetResult<Prisma.$FixturePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Fixtures.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FixtureCountArgs} args - Arguments to filter Fixtures to count.
     * @example
     * // Count the number of Fixtures
     * const count = await prisma.fixture.count({
     *   where: {
     *     // ... the filter for the Fixtures we want to count
     *   }
     * })
    **/
    count<T extends FixtureCountArgs>(
      args?: Subset<T, FixtureCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FixtureCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Fixture.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FixtureAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FixtureAggregateArgs>(args: Subset<T, FixtureAggregateArgs>): Prisma.PrismaPromise<GetFixtureAggregateType<T>>

    /**
     * Group by Fixture.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FixtureGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FixtureGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FixtureGroupByArgs['orderBy'] }
        : { orderBy?: FixtureGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FixtureGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFixtureGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Fixture model
   */
  readonly fields: FixtureFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Fixture.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FixtureClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    statistics<T extends Fixture$statisticsArgs<ExtArgs> = {}>(args?: Subset<T, Fixture$statisticsArgs<ExtArgs>>): Prisma__MatchStatisticsClient<$Result.GetResult<Prisma.$MatchStatisticsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    confidenceScores<T extends Fixture$confidenceScoresArgs<ExtArgs> = {}>(args?: Subset<T, Fixture$confidenceScoresArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConfidenceScorePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    valueBetScans<T extends Fixture$valueBetScansArgs<ExtArgs> = {}>(args?: Subset<T, Fixture$valueBetScansArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ValueBetScanPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Fixture model
   */
  interface FixtureFieldRefs {
    readonly id: FieldRef<"Fixture", 'String'>
    readonly fixtureId: FieldRef<"Fixture", 'String'>
    readonly homeTeam: FieldRef<"Fixture", 'String'>
    readonly awayTeam: FieldRef<"Fixture", 'String'>
    readonly homeTeamId: FieldRef<"Fixture", 'String'>
    readonly awayTeamId: FieldRef<"Fixture", 'String'>
    readonly league: FieldRef<"Fixture", 'String'>
    readonly leagueId: FieldRef<"Fixture", 'String'>
    readonly country: FieldRef<"Fixture", 'String'>
    readonly matchDate: FieldRef<"Fixture", 'DateTime'>
    readonly status: FieldRef<"Fixture", 'FixtureStatus'>
    readonly homeScore: FieldRef<"Fixture", 'Int'>
    readonly awayScore: FieldRef<"Fixture", 'Int'>
    readonly createdAt: FieldRef<"Fixture", 'DateTime'>
    readonly updatedAt: FieldRef<"Fixture", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Fixture findUnique
   */
  export type FixtureFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fixture
     */
    select?: FixtureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fixture
     */
    omit?: FixtureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FixtureInclude<ExtArgs> | null
    /**
     * Filter, which Fixture to fetch.
     */
    where: FixtureWhereUniqueInput
  }

  /**
   * Fixture findUniqueOrThrow
   */
  export type FixtureFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fixture
     */
    select?: FixtureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fixture
     */
    omit?: FixtureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FixtureInclude<ExtArgs> | null
    /**
     * Filter, which Fixture to fetch.
     */
    where: FixtureWhereUniqueInput
  }

  /**
   * Fixture findFirst
   */
  export type FixtureFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fixture
     */
    select?: FixtureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fixture
     */
    omit?: FixtureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FixtureInclude<ExtArgs> | null
    /**
     * Filter, which Fixture to fetch.
     */
    where?: FixtureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Fixtures to fetch.
     */
    orderBy?: FixtureOrderByWithRelationInput | FixtureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Fixtures.
     */
    cursor?: FixtureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Fixtures from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Fixtures.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Fixtures.
     */
    distinct?: FixtureScalarFieldEnum | FixtureScalarFieldEnum[]
  }

  /**
   * Fixture findFirstOrThrow
   */
  export type FixtureFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fixture
     */
    select?: FixtureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fixture
     */
    omit?: FixtureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FixtureInclude<ExtArgs> | null
    /**
     * Filter, which Fixture to fetch.
     */
    where?: FixtureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Fixtures to fetch.
     */
    orderBy?: FixtureOrderByWithRelationInput | FixtureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Fixtures.
     */
    cursor?: FixtureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Fixtures from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Fixtures.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Fixtures.
     */
    distinct?: FixtureScalarFieldEnum | FixtureScalarFieldEnum[]
  }

  /**
   * Fixture findMany
   */
  export type FixtureFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fixture
     */
    select?: FixtureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fixture
     */
    omit?: FixtureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FixtureInclude<ExtArgs> | null
    /**
     * Filter, which Fixtures to fetch.
     */
    where?: FixtureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Fixtures to fetch.
     */
    orderBy?: FixtureOrderByWithRelationInput | FixtureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Fixtures.
     */
    cursor?: FixtureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Fixtures from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Fixtures.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Fixtures.
     */
    distinct?: FixtureScalarFieldEnum | FixtureScalarFieldEnum[]
  }

  /**
   * Fixture create
   */
  export type FixtureCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fixture
     */
    select?: FixtureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fixture
     */
    omit?: FixtureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FixtureInclude<ExtArgs> | null
    /**
     * The data needed to create a Fixture.
     */
    data: XOR<FixtureCreateInput, FixtureUncheckedCreateInput>
  }

  /**
   * Fixture createMany
   */
  export type FixtureCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Fixtures.
     */
    data: FixtureCreateManyInput | FixtureCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Fixture createManyAndReturn
   */
  export type FixtureCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fixture
     */
    select?: FixtureSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Fixture
     */
    omit?: FixtureOmit<ExtArgs> | null
    /**
     * The data used to create many Fixtures.
     */
    data: FixtureCreateManyInput | FixtureCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Fixture update
   */
  export type FixtureUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fixture
     */
    select?: FixtureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fixture
     */
    omit?: FixtureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FixtureInclude<ExtArgs> | null
    /**
     * The data needed to update a Fixture.
     */
    data: XOR<FixtureUpdateInput, FixtureUncheckedUpdateInput>
    /**
     * Choose, which Fixture to update.
     */
    where: FixtureWhereUniqueInput
  }

  /**
   * Fixture updateMany
   */
  export type FixtureUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Fixtures.
     */
    data: XOR<FixtureUpdateManyMutationInput, FixtureUncheckedUpdateManyInput>
    /**
     * Filter which Fixtures to update
     */
    where?: FixtureWhereInput
    /**
     * Limit how many Fixtures to update.
     */
    limit?: number
  }

  /**
   * Fixture updateManyAndReturn
   */
  export type FixtureUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fixture
     */
    select?: FixtureSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Fixture
     */
    omit?: FixtureOmit<ExtArgs> | null
    /**
     * The data used to update Fixtures.
     */
    data: XOR<FixtureUpdateManyMutationInput, FixtureUncheckedUpdateManyInput>
    /**
     * Filter which Fixtures to update
     */
    where?: FixtureWhereInput
    /**
     * Limit how many Fixtures to update.
     */
    limit?: number
  }

  /**
   * Fixture upsert
   */
  export type FixtureUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fixture
     */
    select?: FixtureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fixture
     */
    omit?: FixtureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FixtureInclude<ExtArgs> | null
    /**
     * The filter to search for the Fixture to update in case it exists.
     */
    where: FixtureWhereUniqueInput
    /**
     * In case the Fixture found by the `where` argument doesn't exist, create a new Fixture with this data.
     */
    create: XOR<FixtureCreateInput, FixtureUncheckedCreateInput>
    /**
     * In case the Fixture was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FixtureUpdateInput, FixtureUncheckedUpdateInput>
  }

  /**
   * Fixture delete
   */
  export type FixtureDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fixture
     */
    select?: FixtureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fixture
     */
    omit?: FixtureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FixtureInclude<ExtArgs> | null
    /**
     * Filter which Fixture to delete.
     */
    where: FixtureWhereUniqueInput
  }

  /**
   * Fixture deleteMany
   */
  export type FixtureDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Fixtures to delete
     */
    where?: FixtureWhereInput
    /**
     * Limit how many Fixtures to delete.
     */
    limit?: number
  }

  /**
   * Fixture.statistics
   */
  export type Fixture$statisticsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchStatistics
     */
    select?: MatchStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchStatistics
     */
    omit?: MatchStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchStatisticsInclude<ExtArgs> | null
    where?: MatchStatisticsWhereInput
  }

  /**
   * Fixture.confidenceScores
   */
  export type Fixture$confidenceScoresArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfidenceScore
     */
    select?: ConfidenceScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfidenceScore
     */
    omit?: ConfidenceScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfidenceScoreInclude<ExtArgs> | null
    where?: ConfidenceScoreWhereInput
    orderBy?: ConfidenceScoreOrderByWithRelationInput | ConfidenceScoreOrderByWithRelationInput[]
    cursor?: ConfidenceScoreWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ConfidenceScoreScalarFieldEnum | ConfidenceScoreScalarFieldEnum[]
  }

  /**
   * Fixture.valueBetScans
   */
  export type Fixture$valueBetScansArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ValueBetScan
     */
    select?: ValueBetScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ValueBetScan
     */
    omit?: ValueBetScanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ValueBetScanInclude<ExtArgs> | null
    where?: ValueBetScanWhereInput
    orderBy?: ValueBetScanOrderByWithRelationInput | ValueBetScanOrderByWithRelationInput[]
    cursor?: ValueBetScanWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ValueBetScanScalarFieldEnum | ValueBetScanScalarFieldEnum[]
  }

  /**
   * Fixture without action
   */
  export type FixtureDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fixture
     */
    select?: FixtureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fixture
     */
    omit?: FixtureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FixtureInclude<ExtArgs> | null
  }


  /**
   * Model MatchStatistics
   */

  export type AggregateMatchStatistics = {
    _count: MatchStatisticsCountAggregateOutputType | null
    _avg: MatchStatisticsAvgAggregateOutputType | null
    _sum: MatchStatisticsSumAggregateOutputType | null
    _min: MatchStatisticsMinAggregateOutputType | null
    _max: MatchStatisticsMaxAggregateOutputType | null
  }

  export type MatchStatisticsAvgAggregateOutputType = {
    homeWins: number | null
    homeDraws: number | null
    homeLosses: number | null
    homeGoalsScored: number | null
    homeGoalsConceded: number | null
    homeAvgScored: number | null
    homeAvgConceded: number | null
    awayWins: number | null
    awayDraws: number | null
    awayLosses: number | null
    awayGoalsScored: number | null
    awayGoalsConceded: number | null
    awayAvgScored: number | null
    awayAvgConceded: number | null
    probHome: number | null
    probDraw: number | null
    probAway: number | null
    over15Rate: number | null
    over25Rate: number | null
    bttsRate: number | null
    xGHome: number | null
    xGAway: number | null
    homeInjuredCount: number | null
    awayInjuredCount: number | null
    oddsHome: number | null
    oddsDraw: number | null
    oddsAway: number | null
  }

  export type MatchStatisticsSumAggregateOutputType = {
    homeWins: number | null
    homeDraws: number | null
    homeLosses: number | null
    homeGoalsScored: number | null
    homeGoalsConceded: number | null
    homeAvgScored: number | null
    homeAvgConceded: number | null
    awayWins: number | null
    awayDraws: number | null
    awayLosses: number | null
    awayGoalsScored: number | null
    awayGoalsConceded: number | null
    awayAvgScored: number | null
    awayAvgConceded: number | null
    probHome: number | null
    probDraw: number | null
    probAway: number | null
    over15Rate: number | null
    over25Rate: number | null
    bttsRate: number | null
    xGHome: number | null
    xGAway: number | null
    homeInjuredCount: number | null
    awayInjuredCount: number | null
    oddsHome: number | null
    oddsDraw: number | null
    oddsAway: number | null
  }

  export type MatchStatisticsMinAggregateOutputType = {
    id: string | null
    fixtureId: string | null
    homeFormString: string | null
    homeWins: number | null
    homeDraws: number | null
    homeLosses: number | null
    homeGoalsScored: number | null
    homeGoalsConceded: number | null
    homeAvgScored: number | null
    homeAvgConceded: number | null
    awayFormString: string | null
    awayWins: number | null
    awayDraws: number | null
    awayLosses: number | null
    awayGoalsScored: number | null
    awayGoalsConceded: number | null
    awayAvgScored: number | null
    awayAvgConceded: number | null
    probHome: number | null
    probDraw: number | null
    probAway: number | null
    predictedResult: string | null
    over15Rate: number | null
    over25Rate: number | null
    bttsRate: number | null
    xGHome: number | null
    xGAway: number | null
    homeInjuredCount: number | null
    awayInjuredCount: number | null
    oddsHome: number | null
    oddsDraw: number | null
    oddsAway: number | null
    dataSource: string | null
    fetchedAt: Date | null
    updatedAt: Date | null
  }

  export type MatchStatisticsMaxAggregateOutputType = {
    id: string | null
    fixtureId: string | null
    homeFormString: string | null
    homeWins: number | null
    homeDraws: number | null
    homeLosses: number | null
    homeGoalsScored: number | null
    homeGoalsConceded: number | null
    homeAvgScored: number | null
    homeAvgConceded: number | null
    awayFormString: string | null
    awayWins: number | null
    awayDraws: number | null
    awayLosses: number | null
    awayGoalsScored: number | null
    awayGoalsConceded: number | null
    awayAvgScored: number | null
    awayAvgConceded: number | null
    probHome: number | null
    probDraw: number | null
    probAway: number | null
    predictedResult: string | null
    over15Rate: number | null
    over25Rate: number | null
    bttsRate: number | null
    xGHome: number | null
    xGAway: number | null
    homeInjuredCount: number | null
    awayInjuredCount: number | null
    oddsHome: number | null
    oddsDraw: number | null
    oddsAway: number | null
    dataSource: string | null
    fetchedAt: Date | null
    updatedAt: Date | null
  }

  export type MatchStatisticsCountAggregateOutputType = {
    id: number
    fixtureId: number
    homeFormString: number
    homeWins: number
    homeDraws: number
    homeLosses: number
    homeGoalsScored: number
    homeGoalsConceded: number
    homeAvgScored: number
    homeAvgConceded: number
    awayFormString: number
    awayWins: number
    awayDraws: number
    awayLosses: number
    awayGoalsScored: number
    awayGoalsConceded: number
    awayAvgScored: number
    awayAvgConceded: number
    probHome: number
    probDraw: number
    probAway: number
    predictedResult: number
    over15Rate: number
    over25Rate: number
    bttsRate: number
    xGHome: number
    xGAway: number
    homeInjuredCount: number
    awayInjuredCount: number
    oddsHome: number
    oddsDraw: number
    oddsAway: number
    dataSource: number
    fetchedAt: number
    updatedAt: number
    _all: number
  }


  export type MatchStatisticsAvgAggregateInputType = {
    homeWins?: true
    homeDraws?: true
    homeLosses?: true
    homeGoalsScored?: true
    homeGoalsConceded?: true
    homeAvgScored?: true
    homeAvgConceded?: true
    awayWins?: true
    awayDraws?: true
    awayLosses?: true
    awayGoalsScored?: true
    awayGoalsConceded?: true
    awayAvgScored?: true
    awayAvgConceded?: true
    probHome?: true
    probDraw?: true
    probAway?: true
    over15Rate?: true
    over25Rate?: true
    bttsRate?: true
    xGHome?: true
    xGAway?: true
    homeInjuredCount?: true
    awayInjuredCount?: true
    oddsHome?: true
    oddsDraw?: true
    oddsAway?: true
  }

  export type MatchStatisticsSumAggregateInputType = {
    homeWins?: true
    homeDraws?: true
    homeLosses?: true
    homeGoalsScored?: true
    homeGoalsConceded?: true
    homeAvgScored?: true
    homeAvgConceded?: true
    awayWins?: true
    awayDraws?: true
    awayLosses?: true
    awayGoalsScored?: true
    awayGoalsConceded?: true
    awayAvgScored?: true
    awayAvgConceded?: true
    probHome?: true
    probDraw?: true
    probAway?: true
    over15Rate?: true
    over25Rate?: true
    bttsRate?: true
    xGHome?: true
    xGAway?: true
    homeInjuredCount?: true
    awayInjuredCount?: true
    oddsHome?: true
    oddsDraw?: true
    oddsAway?: true
  }

  export type MatchStatisticsMinAggregateInputType = {
    id?: true
    fixtureId?: true
    homeFormString?: true
    homeWins?: true
    homeDraws?: true
    homeLosses?: true
    homeGoalsScored?: true
    homeGoalsConceded?: true
    homeAvgScored?: true
    homeAvgConceded?: true
    awayFormString?: true
    awayWins?: true
    awayDraws?: true
    awayLosses?: true
    awayGoalsScored?: true
    awayGoalsConceded?: true
    awayAvgScored?: true
    awayAvgConceded?: true
    probHome?: true
    probDraw?: true
    probAway?: true
    predictedResult?: true
    over15Rate?: true
    over25Rate?: true
    bttsRate?: true
    xGHome?: true
    xGAway?: true
    homeInjuredCount?: true
    awayInjuredCount?: true
    oddsHome?: true
    oddsDraw?: true
    oddsAway?: true
    dataSource?: true
    fetchedAt?: true
    updatedAt?: true
  }

  export type MatchStatisticsMaxAggregateInputType = {
    id?: true
    fixtureId?: true
    homeFormString?: true
    homeWins?: true
    homeDraws?: true
    homeLosses?: true
    homeGoalsScored?: true
    homeGoalsConceded?: true
    homeAvgScored?: true
    homeAvgConceded?: true
    awayFormString?: true
    awayWins?: true
    awayDraws?: true
    awayLosses?: true
    awayGoalsScored?: true
    awayGoalsConceded?: true
    awayAvgScored?: true
    awayAvgConceded?: true
    probHome?: true
    probDraw?: true
    probAway?: true
    predictedResult?: true
    over15Rate?: true
    over25Rate?: true
    bttsRate?: true
    xGHome?: true
    xGAway?: true
    homeInjuredCount?: true
    awayInjuredCount?: true
    oddsHome?: true
    oddsDraw?: true
    oddsAway?: true
    dataSource?: true
    fetchedAt?: true
    updatedAt?: true
  }

  export type MatchStatisticsCountAggregateInputType = {
    id?: true
    fixtureId?: true
    homeFormString?: true
    homeWins?: true
    homeDraws?: true
    homeLosses?: true
    homeGoalsScored?: true
    homeGoalsConceded?: true
    homeAvgScored?: true
    homeAvgConceded?: true
    awayFormString?: true
    awayWins?: true
    awayDraws?: true
    awayLosses?: true
    awayGoalsScored?: true
    awayGoalsConceded?: true
    awayAvgScored?: true
    awayAvgConceded?: true
    probHome?: true
    probDraw?: true
    probAway?: true
    predictedResult?: true
    over15Rate?: true
    over25Rate?: true
    bttsRate?: true
    xGHome?: true
    xGAway?: true
    homeInjuredCount?: true
    awayInjuredCount?: true
    oddsHome?: true
    oddsDraw?: true
    oddsAway?: true
    dataSource?: true
    fetchedAt?: true
    updatedAt?: true
    _all?: true
  }

  export type MatchStatisticsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MatchStatistics to aggregate.
     */
    where?: MatchStatisticsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MatchStatistics to fetch.
     */
    orderBy?: MatchStatisticsOrderByWithRelationInput | MatchStatisticsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MatchStatisticsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MatchStatistics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MatchStatistics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MatchStatistics
    **/
    _count?: true | MatchStatisticsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MatchStatisticsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MatchStatisticsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MatchStatisticsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MatchStatisticsMaxAggregateInputType
  }

  export type GetMatchStatisticsAggregateType<T extends MatchStatisticsAggregateArgs> = {
        [P in keyof T & keyof AggregateMatchStatistics]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMatchStatistics[P]>
      : GetScalarType<T[P], AggregateMatchStatistics[P]>
  }




  export type MatchStatisticsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MatchStatisticsWhereInput
    orderBy?: MatchStatisticsOrderByWithAggregationInput | MatchStatisticsOrderByWithAggregationInput[]
    by: MatchStatisticsScalarFieldEnum[] | MatchStatisticsScalarFieldEnum
    having?: MatchStatisticsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MatchStatisticsCountAggregateInputType | true
    _avg?: MatchStatisticsAvgAggregateInputType
    _sum?: MatchStatisticsSumAggregateInputType
    _min?: MatchStatisticsMinAggregateInputType
    _max?: MatchStatisticsMaxAggregateInputType
  }

  export type MatchStatisticsGroupByOutputType = {
    id: string
    fixtureId: string
    homeFormString: string | null
    homeWins: number
    homeDraws: number
    homeLosses: number
    homeGoalsScored: number
    homeGoalsConceded: number
    homeAvgScored: number
    homeAvgConceded: number
    awayFormString: string | null
    awayWins: number
    awayDraws: number
    awayLosses: number
    awayGoalsScored: number
    awayGoalsConceded: number
    awayAvgScored: number
    awayAvgConceded: number
    probHome: number
    probDraw: number
    probAway: number
    predictedResult: string | null
    over15Rate: number
    over25Rate: number
    bttsRate: number
    xGHome: number | null
    xGAway: number | null
    homeInjuredCount: number
    awayInjuredCount: number
    oddsHome: number | null
    oddsDraw: number | null
    oddsAway: number | null
    dataSource: string
    fetchedAt: Date
    updatedAt: Date
    _count: MatchStatisticsCountAggregateOutputType | null
    _avg: MatchStatisticsAvgAggregateOutputType | null
    _sum: MatchStatisticsSumAggregateOutputType | null
    _min: MatchStatisticsMinAggregateOutputType | null
    _max: MatchStatisticsMaxAggregateOutputType | null
  }

  type GetMatchStatisticsGroupByPayload<T extends MatchStatisticsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MatchStatisticsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MatchStatisticsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MatchStatisticsGroupByOutputType[P]>
            : GetScalarType<T[P], MatchStatisticsGroupByOutputType[P]>
        }
      >
    >


  export type MatchStatisticsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fixtureId?: boolean
    homeFormString?: boolean
    homeWins?: boolean
    homeDraws?: boolean
    homeLosses?: boolean
    homeGoalsScored?: boolean
    homeGoalsConceded?: boolean
    homeAvgScored?: boolean
    homeAvgConceded?: boolean
    awayFormString?: boolean
    awayWins?: boolean
    awayDraws?: boolean
    awayLosses?: boolean
    awayGoalsScored?: boolean
    awayGoalsConceded?: boolean
    awayAvgScored?: boolean
    awayAvgConceded?: boolean
    probHome?: boolean
    probDraw?: boolean
    probAway?: boolean
    predictedResult?: boolean
    over15Rate?: boolean
    over25Rate?: boolean
    bttsRate?: boolean
    xGHome?: boolean
    xGAway?: boolean
    homeInjuredCount?: boolean
    awayInjuredCount?: boolean
    oddsHome?: boolean
    oddsDraw?: boolean
    oddsAway?: boolean
    dataSource?: boolean
    fetchedAt?: boolean
    updatedAt?: boolean
    fixture?: boolean | FixtureDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["matchStatistics"]>

  export type MatchStatisticsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fixtureId?: boolean
    homeFormString?: boolean
    homeWins?: boolean
    homeDraws?: boolean
    homeLosses?: boolean
    homeGoalsScored?: boolean
    homeGoalsConceded?: boolean
    homeAvgScored?: boolean
    homeAvgConceded?: boolean
    awayFormString?: boolean
    awayWins?: boolean
    awayDraws?: boolean
    awayLosses?: boolean
    awayGoalsScored?: boolean
    awayGoalsConceded?: boolean
    awayAvgScored?: boolean
    awayAvgConceded?: boolean
    probHome?: boolean
    probDraw?: boolean
    probAway?: boolean
    predictedResult?: boolean
    over15Rate?: boolean
    over25Rate?: boolean
    bttsRate?: boolean
    xGHome?: boolean
    xGAway?: boolean
    homeInjuredCount?: boolean
    awayInjuredCount?: boolean
    oddsHome?: boolean
    oddsDraw?: boolean
    oddsAway?: boolean
    dataSource?: boolean
    fetchedAt?: boolean
    updatedAt?: boolean
    fixture?: boolean | FixtureDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["matchStatistics"]>

  export type MatchStatisticsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fixtureId?: boolean
    homeFormString?: boolean
    homeWins?: boolean
    homeDraws?: boolean
    homeLosses?: boolean
    homeGoalsScored?: boolean
    homeGoalsConceded?: boolean
    homeAvgScored?: boolean
    homeAvgConceded?: boolean
    awayFormString?: boolean
    awayWins?: boolean
    awayDraws?: boolean
    awayLosses?: boolean
    awayGoalsScored?: boolean
    awayGoalsConceded?: boolean
    awayAvgScored?: boolean
    awayAvgConceded?: boolean
    probHome?: boolean
    probDraw?: boolean
    probAway?: boolean
    predictedResult?: boolean
    over15Rate?: boolean
    over25Rate?: boolean
    bttsRate?: boolean
    xGHome?: boolean
    xGAway?: boolean
    homeInjuredCount?: boolean
    awayInjuredCount?: boolean
    oddsHome?: boolean
    oddsDraw?: boolean
    oddsAway?: boolean
    dataSource?: boolean
    fetchedAt?: boolean
    updatedAt?: boolean
    fixture?: boolean | FixtureDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["matchStatistics"]>

  export type MatchStatisticsSelectScalar = {
    id?: boolean
    fixtureId?: boolean
    homeFormString?: boolean
    homeWins?: boolean
    homeDraws?: boolean
    homeLosses?: boolean
    homeGoalsScored?: boolean
    homeGoalsConceded?: boolean
    homeAvgScored?: boolean
    homeAvgConceded?: boolean
    awayFormString?: boolean
    awayWins?: boolean
    awayDraws?: boolean
    awayLosses?: boolean
    awayGoalsScored?: boolean
    awayGoalsConceded?: boolean
    awayAvgScored?: boolean
    awayAvgConceded?: boolean
    probHome?: boolean
    probDraw?: boolean
    probAway?: boolean
    predictedResult?: boolean
    over15Rate?: boolean
    over25Rate?: boolean
    bttsRate?: boolean
    xGHome?: boolean
    xGAway?: boolean
    homeInjuredCount?: boolean
    awayInjuredCount?: boolean
    oddsHome?: boolean
    oddsDraw?: boolean
    oddsAway?: boolean
    dataSource?: boolean
    fetchedAt?: boolean
    updatedAt?: boolean
  }

  export type MatchStatisticsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "fixtureId" | "homeFormString" | "homeWins" | "homeDraws" | "homeLosses" | "homeGoalsScored" | "homeGoalsConceded" | "homeAvgScored" | "homeAvgConceded" | "awayFormString" | "awayWins" | "awayDraws" | "awayLosses" | "awayGoalsScored" | "awayGoalsConceded" | "awayAvgScored" | "awayAvgConceded" | "probHome" | "probDraw" | "probAway" | "predictedResult" | "over15Rate" | "over25Rate" | "bttsRate" | "xGHome" | "xGAway" | "homeInjuredCount" | "awayInjuredCount" | "oddsHome" | "oddsDraw" | "oddsAway" | "dataSource" | "fetchedAt" | "updatedAt", ExtArgs["result"]["matchStatistics"]>
  export type MatchStatisticsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    fixture?: boolean | FixtureDefaultArgs<ExtArgs>
  }
  export type MatchStatisticsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    fixture?: boolean | FixtureDefaultArgs<ExtArgs>
  }
  export type MatchStatisticsIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    fixture?: boolean | FixtureDefaultArgs<ExtArgs>
  }

  export type $MatchStatisticsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MatchStatistics"
    objects: {
      fixture: Prisma.$FixturePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      fixtureId: string
      homeFormString: string | null
      homeWins: number
      homeDraws: number
      homeLosses: number
      homeGoalsScored: number
      homeGoalsConceded: number
      homeAvgScored: number
      homeAvgConceded: number
      awayFormString: string | null
      awayWins: number
      awayDraws: number
      awayLosses: number
      awayGoalsScored: number
      awayGoalsConceded: number
      awayAvgScored: number
      awayAvgConceded: number
      probHome: number
      probDraw: number
      probAway: number
      predictedResult: string | null
      over15Rate: number
      over25Rate: number
      bttsRate: number
      xGHome: number | null
      xGAway: number | null
      homeInjuredCount: number
      awayInjuredCount: number
      oddsHome: number | null
      oddsDraw: number | null
      oddsAway: number | null
      dataSource: string
      fetchedAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["matchStatistics"]>
    composites: {}
  }

  type MatchStatisticsGetPayload<S extends boolean | null | undefined | MatchStatisticsDefaultArgs> = $Result.GetResult<Prisma.$MatchStatisticsPayload, S>

  type MatchStatisticsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MatchStatisticsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MatchStatisticsCountAggregateInputType | true
    }

  export interface MatchStatisticsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MatchStatistics'], meta: { name: 'MatchStatistics' } }
    /**
     * Find zero or one MatchStatistics that matches the filter.
     * @param {MatchStatisticsFindUniqueArgs} args - Arguments to find a MatchStatistics
     * @example
     * // Get one MatchStatistics
     * const matchStatistics = await prisma.matchStatistics.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MatchStatisticsFindUniqueArgs>(args: SelectSubset<T, MatchStatisticsFindUniqueArgs<ExtArgs>>): Prisma__MatchStatisticsClient<$Result.GetResult<Prisma.$MatchStatisticsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one MatchStatistics that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MatchStatisticsFindUniqueOrThrowArgs} args - Arguments to find a MatchStatistics
     * @example
     * // Get one MatchStatistics
     * const matchStatistics = await prisma.matchStatistics.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MatchStatisticsFindUniqueOrThrowArgs>(args: SelectSubset<T, MatchStatisticsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MatchStatisticsClient<$Result.GetResult<Prisma.$MatchStatisticsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MatchStatistics that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchStatisticsFindFirstArgs} args - Arguments to find a MatchStatistics
     * @example
     * // Get one MatchStatistics
     * const matchStatistics = await prisma.matchStatistics.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MatchStatisticsFindFirstArgs>(args?: SelectSubset<T, MatchStatisticsFindFirstArgs<ExtArgs>>): Prisma__MatchStatisticsClient<$Result.GetResult<Prisma.$MatchStatisticsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MatchStatistics that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchStatisticsFindFirstOrThrowArgs} args - Arguments to find a MatchStatistics
     * @example
     * // Get one MatchStatistics
     * const matchStatistics = await prisma.matchStatistics.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MatchStatisticsFindFirstOrThrowArgs>(args?: SelectSubset<T, MatchStatisticsFindFirstOrThrowArgs<ExtArgs>>): Prisma__MatchStatisticsClient<$Result.GetResult<Prisma.$MatchStatisticsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more MatchStatistics that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchStatisticsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MatchStatistics
     * const matchStatistics = await prisma.matchStatistics.findMany()
     * 
     * // Get first 10 MatchStatistics
     * const matchStatistics = await prisma.matchStatistics.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const matchStatisticsWithIdOnly = await prisma.matchStatistics.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MatchStatisticsFindManyArgs>(args?: SelectSubset<T, MatchStatisticsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MatchStatisticsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a MatchStatistics.
     * @param {MatchStatisticsCreateArgs} args - Arguments to create a MatchStatistics.
     * @example
     * // Create one MatchStatistics
     * const MatchStatistics = await prisma.matchStatistics.create({
     *   data: {
     *     // ... data to create a MatchStatistics
     *   }
     * })
     * 
     */
    create<T extends MatchStatisticsCreateArgs>(args: SelectSubset<T, MatchStatisticsCreateArgs<ExtArgs>>): Prisma__MatchStatisticsClient<$Result.GetResult<Prisma.$MatchStatisticsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many MatchStatistics.
     * @param {MatchStatisticsCreateManyArgs} args - Arguments to create many MatchStatistics.
     * @example
     * // Create many MatchStatistics
     * const matchStatistics = await prisma.matchStatistics.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MatchStatisticsCreateManyArgs>(args?: SelectSubset<T, MatchStatisticsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many MatchStatistics and returns the data saved in the database.
     * @param {MatchStatisticsCreateManyAndReturnArgs} args - Arguments to create many MatchStatistics.
     * @example
     * // Create many MatchStatistics
     * const matchStatistics = await prisma.matchStatistics.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many MatchStatistics and only return the `id`
     * const matchStatisticsWithIdOnly = await prisma.matchStatistics.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MatchStatisticsCreateManyAndReturnArgs>(args?: SelectSubset<T, MatchStatisticsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MatchStatisticsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a MatchStatistics.
     * @param {MatchStatisticsDeleteArgs} args - Arguments to delete one MatchStatistics.
     * @example
     * // Delete one MatchStatistics
     * const MatchStatistics = await prisma.matchStatistics.delete({
     *   where: {
     *     // ... filter to delete one MatchStatistics
     *   }
     * })
     * 
     */
    delete<T extends MatchStatisticsDeleteArgs>(args: SelectSubset<T, MatchStatisticsDeleteArgs<ExtArgs>>): Prisma__MatchStatisticsClient<$Result.GetResult<Prisma.$MatchStatisticsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one MatchStatistics.
     * @param {MatchStatisticsUpdateArgs} args - Arguments to update one MatchStatistics.
     * @example
     * // Update one MatchStatistics
     * const matchStatistics = await prisma.matchStatistics.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MatchStatisticsUpdateArgs>(args: SelectSubset<T, MatchStatisticsUpdateArgs<ExtArgs>>): Prisma__MatchStatisticsClient<$Result.GetResult<Prisma.$MatchStatisticsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more MatchStatistics.
     * @param {MatchStatisticsDeleteManyArgs} args - Arguments to filter MatchStatistics to delete.
     * @example
     * // Delete a few MatchStatistics
     * const { count } = await prisma.matchStatistics.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MatchStatisticsDeleteManyArgs>(args?: SelectSubset<T, MatchStatisticsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MatchStatistics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchStatisticsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MatchStatistics
     * const matchStatistics = await prisma.matchStatistics.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MatchStatisticsUpdateManyArgs>(args: SelectSubset<T, MatchStatisticsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MatchStatistics and returns the data updated in the database.
     * @param {MatchStatisticsUpdateManyAndReturnArgs} args - Arguments to update many MatchStatistics.
     * @example
     * // Update many MatchStatistics
     * const matchStatistics = await prisma.matchStatistics.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more MatchStatistics and only return the `id`
     * const matchStatisticsWithIdOnly = await prisma.matchStatistics.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MatchStatisticsUpdateManyAndReturnArgs>(args: SelectSubset<T, MatchStatisticsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MatchStatisticsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one MatchStatistics.
     * @param {MatchStatisticsUpsertArgs} args - Arguments to update or create a MatchStatistics.
     * @example
     * // Update or create a MatchStatistics
     * const matchStatistics = await prisma.matchStatistics.upsert({
     *   create: {
     *     // ... data to create a MatchStatistics
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MatchStatistics we want to update
     *   }
     * })
     */
    upsert<T extends MatchStatisticsUpsertArgs>(args: SelectSubset<T, MatchStatisticsUpsertArgs<ExtArgs>>): Prisma__MatchStatisticsClient<$Result.GetResult<Prisma.$MatchStatisticsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of MatchStatistics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchStatisticsCountArgs} args - Arguments to filter MatchStatistics to count.
     * @example
     * // Count the number of MatchStatistics
     * const count = await prisma.matchStatistics.count({
     *   where: {
     *     // ... the filter for the MatchStatistics we want to count
     *   }
     * })
    **/
    count<T extends MatchStatisticsCountArgs>(
      args?: Subset<T, MatchStatisticsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MatchStatisticsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MatchStatistics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchStatisticsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MatchStatisticsAggregateArgs>(args: Subset<T, MatchStatisticsAggregateArgs>): Prisma.PrismaPromise<GetMatchStatisticsAggregateType<T>>

    /**
     * Group by MatchStatistics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchStatisticsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MatchStatisticsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MatchStatisticsGroupByArgs['orderBy'] }
        : { orderBy?: MatchStatisticsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MatchStatisticsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMatchStatisticsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MatchStatistics model
   */
  readonly fields: MatchStatisticsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MatchStatistics.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MatchStatisticsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    fixture<T extends FixtureDefaultArgs<ExtArgs> = {}>(args?: Subset<T, FixtureDefaultArgs<ExtArgs>>): Prisma__FixtureClient<$Result.GetResult<Prisma.$FixturePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the MatchStatistics model
   */
  interface MatchStatisticsFieldRefs {
    readonly id: FieldRef<"MatchStatistics", 'String'>
    readonly fixtureId: FieldRef<"MatchStatistics", 'String'>
    readonly homeFormString: FieldRef<"MatchStatistics", 'String'>
    readonly homeWins: FieldRef<"MatchStatistics", 'Int'>
    readonly homeDraws: FieldRef<"MatchStatistics", 'Int'>
    readonly homeLosses: FieldRef<"MatchStatistics", 'Int'>
    readonly homeGoalsScored: FieldRef<"MatchStatistics", 'Int'>
    readonly homeGoalsConceded: FieldRef<"MatchStatistics", 'Int'>
    readonly homeAvgScored: FieldRef<"MatchStatistics", 'Float'>
    readonly homeAvgConceded: FieldRef<"MatchStatistics", 'Float'>
    readonly awayFormString: FieldRef<"MatchStatistics", 'String'>
    readonly awayWins: FieldRef<"MatchStatistics", 'Int'>
    readonly awayDraws: FieldRef<"MatchStatistics", 'Int'>
    readonly awayLosses: FieldRef<"MatchStatistics", 'Int'>
    readonly awayGoalsScored: FieldRef<"MatchStatistics", 'Int'>
    readonly awayGoalsConceded: FieldRef<"MatchStatistics", 'Int'>
    readonly awayAvgScored: FieldRef<"MatchStatistics", 'Float'>
    readonly awayAvgConceded: FieldRef<"MatchStatistics", 'Float'>
    readonly probHome: FieldRef<"MatchStatistics", 'Float'>
    readonly probDraw: FieldRef<"MatchStatistics", 'Float'>
    readonly probAway: FieldRef<"MatchStatistics", 'Float'>
    readonly predictedResult: FieldRef<"MatchStatistics", 'String'>
    readonly over15Rate: FieldRef<"MatchStatistics", 'Float'>
    readonly over25Rate: FieldRef<"MatchStatistics", 'Float'>
    readonly bttsRate: FieldRef<"MatchStatistics", 'Float'>
    readonly xGHome: FieldRef<"MatchStatistics", 'Float'>
    readonly xGAway: FieldRef<"MatchStatistics", 'Float'>
    readonly homeInjuredCount: FieldRef<"MatchStatistics", 'Int'>
    readonly awayInjuredCount: FieldRef<"MatchStatistics", 'Int'>
    readonly oddsHome: FieldRef<"MatchStatistics", 'Float'>
    readonly oddsDraw: FieldRef<"MatchStatistics", 'Float'>
    readonly oddsAway: FieldRef<"MatchStatistics", 'Float'>
    readonly dataSource: FieldRef<"MatchStatistics", 'String'>
    readonly fetchedAt: FieldRef<"MatchStatistics", 'DateTime'>
    readonly updatedAt: FieldRef<"MatchStatistics", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * MatchStatistics findUnique
   */
  export type MatchStatisticsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchStatistics
     */
    select?: MatchStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchStatistics
     */
    omit?: MatchStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchStatisticsInclude<ExtArgs> | null
    /**
     * Filter, which MatchStatistics to fetch.
     */
    where: MatchStatisticsWhereUniqueInput
  }

  /**
   * MatchStatistics findUniqueOrThrow
   */
  export type MatchStatisticsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchStatistics
     */
    select?: MatchStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchStatistics
     */
    omit?: MatchStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchStatisticsInclude<ExtArgs> | null
    /**
     * Filter, which MatchStatistics to fetch.
     */
    where: MatchStatisticsWhereUniqueInput
  }

  /**
   * MatchStatistics findFirst
   */
  export type MatchStatisticsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchStatistics
     */
    select?: MatchStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchStatistics
     */
    omit?: MatchStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchStatisticsInclude<ExtArgs> | null
    /**
     * Filter, which MatchStatistics to fetch.
     */
    where?: MatchStatisticsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MatchStatistics to fetch.
     */
    orderBy?: MatchStatisticsOrderByWithRelationInput | MatchStatisticsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MatchStatistics.
     */
    cursor?: MatchStatisticsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MatchStatistics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MatchStatistics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MatchStatistics.
     */
    distinct?: MatchStatisticsScalarFieldEnum | MatchStatisticsScalarFieldEnum[]
  }

  /**
   * MatchStatistics findFirstOrThrow
   */
  export type MatchStatisticsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchStatistics
     */
    select?: MatchStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchStatistics
     */
    omit?: MatchStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchStatisticsInclude<ExtArgs> | null
    /**
     * Filter, which MatchStatistics to fetch.
     */
    where?: MatchStatisticsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MatchStatistics to fetch.
     */
    orderBy?: MatchStatisticsOrderByWithRelationInput | MatchStatisticsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MatchStatistics.
     */
    cursor?: MatchStatisticsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MatchStatistics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MatchStatistics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MatchStatistics.
     */
    distinct?: MatchStatisticsScalarFieldEnum | MatchStatisticsScalarFieldEnum[]
  }

  /**
   * MatchStatistics findMany
   */
  export type MatchStatisticsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchStatistics
     */
    select?: MatchStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchStatistics
     */
    omit?: MatchStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchStatisticsInclude<ExtArgs> | null
    /**
     * Filter, which MatchStatistics to fetch.
     */
    where?: MatchStatisticsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MatchStatistics to fetch.
     */
    orderBy?: MatchStatisticsOrderByWithRelationInput | MatchStatisticsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MatchStatistics.
     */
    cursor?: MatchStatisticsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MatchStatistics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MatchStatistics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MatchStatistics.
     */
    distinct?: MatchStatisticsScalarFieldEnum | MatchStatisticsScalarFieldEnum[]
  }

  /**
   * MatchStatistics create
   */
  export type MatchStatisticsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchStatistics
     */
    select?: MatchStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchStatistics
     */
    omit?: MatchStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchStatisticsInclude<ExtArgs> | null
    /**
     * The data needed to create a MatchStatistics.
     */
    data: XOR<MatchStatisticsCreateInput, MatchStatisticsUncheckedCreateInput>
  }

  /**
   * MatchStatistics createMany
   */
  export type MatchStatisticsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MatchStatistics.
     */
    data: MatchStatisticsCreateManyInput | MatchStatisticsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MatchStatistics createManyAndReturn
   */
  export type MatchStatisticsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchStatistics
     */
    select?: MatchStatisticsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MatchStatistics
     */
    omit?: MatchStatisticsOmit<ExtArgs> | null
    /**
     * The data used to create many MatchStatistics.
     */
    data: MatchStatisticsCreateManyInput | MatchStatisticsCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchStatisticsIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * MatchStatistics update
   */
  export type MatchStatisticsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchStatistics
     */
    select?: MatchStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchStatistics
     */
    omit?: MatchStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchStatisticsInclude<ExtArgs> | null
    /**
     * The data needed to update a MatchStatistics.
     */
    data: XOR<MatchStatisticsUpdateInput, MatchStatisticsUncheckedUpdateInput>
    /**
     * Choose, which MatchStatistics to update.
     */
    where: MatchStatisticsWhereUniqueInput
  }

  /**
   * MatchStatistics updateMany
   */
  export type MatchStatisticsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MatchStatistics.
     */
    data: XOR<MatchStatisticsUpdateManyMutationInput, MatchStatisticsUncheckedUpdateManyInput>
    /**
     * Filter which MatchStatistics to update
     */
    where?: MatchStatisticsWhereInput
    /**
     * Limit how many MatchStatistics to update.
     */
    limit?: number
  }

  /**
   * MatchStatistics updateManyAndReturn
   */
  export type MatchStatisticsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchStatistics
     */
    select?: MatchStatisticsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MatchStatistics
     */
    omit?: MatchStatisticsOmit<ExtArgs> | null
    /**
     * The data used to update MatchStatistics.
     */
    data: XOR<MatchStatisticsUpdateManyMutationInput, MatchStatisticsUncheckedUpdateManyInput>
    /**
     * Filter which MatchStatistics to update
     */
    where?: MatchStatisticsWhereInput
    /**
     * Limit how many MatchStatistics to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchStatisticsIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * MatchStatistics upsert
   */
  export type MatchStatisticsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchStatistics
     */
    select?: MatchStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchStatistics
     */
    omit?: MatchStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchStatisticsInclude<ExtArgs> | null
    /**
     * The filter to search for the MatchStatistics to update in case it exists.
     */
    where: MatchStatisticsWhereUniqueInput
    /**
     * In case the MatchStatistics found by the `where` argument doesn't exist, create a new MatchStatistics with this data.
     */
    create: XOR<MatchStatisticsCreateInput, MatchStatisticsUncheckedCreateInput>
    /**
     * In case the MatchStatistics was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MatchStatisticsUpdateInput, MatchStatisticsUncheckedUpdateInput>
  }

  /**
   * MatchStatistics delete
   */
  export type MatchStatisticsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchStatistics
     */
    select?: MatchStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchStatistics
     */
    omit?: MatchStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchStatisticsInclude<ExtArgs> | null
    /**
     * Filter which MatchStatistics to delete.
     */
    where: MatchStatisticsWhereUniqueInput
  }

  /**
   * MatchStatistics deleteMany
   */
  export type MatchStatisticsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MatchStatistics to delete
     */
    where?: MatchStatisticsWhereInput
    /**
     * Limit how many MatchStatistics to delete.
     */
    limit?: number
  }

  /**
   * MatchStatistics without action
   */
  export type MatchStatisticsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchStatistics
     */
    select?: MatchStatisticsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MatchStatistics
     */
    omit?: MatchStatisticsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MatchStatisticsInclude<ExtArgs> | null
  }


  /**
   * Model H2HRecord
   */

  export type AggregateH2HRecord = {
    _count: H2HRecordCountAggregateOutputType | null
    _avg: H2HRecordAvgAggregateOutputType | null
    _sum: H2HRecordSumAggregateOutputType | null
    _min: H2HRecordMinAggregateOutputType | null
    _max: H2HRecordMaxAggregateOutputType | null
  }

  export type H2HRecordAvgAggregateOutputType = {
    totalMeetings: number | null
    homeWins: number | null
    awayWins: number | null
    draws: number | null
    totalGoals: number | null
    avgGoalsPerGame: number | null
    homeWinRate: number | null
    awayWinRate: number | null
    drawRate: number | null
  }

  export type H2HRecordSumAggregateOutputType = {
    totalMeetings: number | null
    homeWins: number | null
    awayWins: number | null
    draws: number | null
    totalGoals: number | null
    avgGoalsPerGame: number | null
    homeWinRate: number | null
    awayWinRate: number | null
    drawRate: number | null
  }

  export type H2HRecordMinAggregateOutputType = {
    id: string | null
    homeTeamId: string | null
    awayTeamId: string | null
    totalMeetings: number | null
    homeWins: number | null
    awayWins: number | null
    draws: number | null
    totalGoals: number | null
    avgGoalsPerGame: number | null
    homeWinRate: number | null
    awayWinRate: number | null
    drawRate: number | null
    updatedAt: Date | null
  }

  export type H2HRecordMaxAggregateOutputType = {
    id: string | null
    homeTeamId: string | null
    awayTeamId: string | null
    totalMeetings: number | null
    homeWins: number | null
    awayWins: number | null
    draws: number | null
    totalGoals: number | null
    avgGoalsPerGame: number | null
    homeWinRate: number | null
    awayWinRate: number | null
    drawRate: number | null
    updatedAt: Date | null
  }

  export type H2HRecordCountAggregateOutputType = {
    id: number
    homeTeamId: number
    awayTeamId: number
    totalMeetings: number
    homeWins: number
    awayWins: number
    draws: number
    totalGoals: number
    avgGoalsPerGame: number
    homeWinRate: number
    awayWinRate: number
    drawRate: number
    updatedAt: number
    _all: number
  }


  export type H2HRecordAvgAggregateInputType = {
    totalMeetings?: true
    homeWins?: true
    awayWins?: true
    draws?: true
    totalGoals?: true
    avgGoalsPerGame?: true
    homeWinRate?: true
    awayWinRate?: true
    drawRate?: true
  }

  export type H2HRecordSumAggregateInputType = {
    totalMeetings?: true
    homeWins?: true
    awayWins?: true
    draws?: true
    totalGoals?: true
    avgGoalsPerGame?: true
    homeWinRate?: true
    awayWinRate?: true
    drawRate?: true
  }

  export type H2HRecordMinAggregateInputType = {
    id?: true
    homeTeamId?: true
    awayTeamId?: true
    totalMeetings?: true
    homeWins?: true
    awayWins?: true
    draws?: true
    totalGoals?: true
    avgGoalsPerGame?: true
    homeWinRate?: true
    awayWinRate?: true
    drawRate?: true
    updatedAt?: true
  }

  export type H2HRecordMaxAggregateInputType = {
    id?: true
    homeTeamId?: true
    awayTeamId?: true
    totalMeetings?: true
    homeWins?: true
    awayWins?: true
    draws?: true
    totalGoals?: true
    avgGoalsPerGame?: true
    homeWinRate?: true
    awayWinRate?: true
    drawRate?: true
    updatedAt?: true
  }

  export type H2HRecordCountAggregateInputType = {
    id?: true
    homeTeamId?: true
    awayTeamId?: true
    totalMeetings?: true
    homeWins?: true
    awayWins?: true
    draws?: true
    totalGoals?: true
    avgGoalsPerGame?: true
    homeWinRate?: true
    awayWinRate?: true
    drawRate?: true
    updatedAt?: true
    _all?: true
  }

  export type H2HRecordAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which H2HRecord to aggregate.
     */
    where?: H2HRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of H2HRecords to fetch.
     */
    orderBy?: H2HRecordOrderByWithRelationInput | H2HRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: H2HRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` H2HRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` H2HRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned H2HRecords
    **/
    _count?: true | H2HRecordCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: H2HRecordAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: H2HRecordSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: H2HRecordMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: H2HRecordMaxAggregateInputType
  }

  export type GetH2HRecordAggregateType<T extends H2HRecordAggregateArgs> = {
        [P in keyof T & keyof AggregateH2HRecord]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateH2HRecord[P]>
      : GetScalarType<T[P], AggregateH2HRecord[P]>
  }




  export type H2HRecordGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: H2HRecordWhereInput
    orderBy?: H2HRecordOrderByWithAggregationInput | H2HRecordOrderByWithAggregationInput[]
    by: H2HRecordScalarFieldEnum[] | H2HRecordScalarFieldEnum
    having?: H2HRecordScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: H2HRecordCountAggregateInputType | true
    _avg?: H2HRecordAvgAggregateInputType
    _sum?: H2HRecordSumAggregateInputType
    _min?: H2HRecordMinAggregateInputType
    _max?: H2HRecordMaxAggregateInputType
  }

  export type H2HRecordGroupByOutputType = {
    id: string
    homeTeamId: string
    awayTeamId: string
    totalMeetings: number
    homeWins: number
    awayWins: number
    draws: number
    totalGoals: number
    avgGoalsPerGame: number
    homeWinRate: number
    awayWinRate: number
    drawRate: number
    updatedAt: Date
    _count: H2HRecordCountAggregateOutputType | null
    _avg: H2HRecordAvgAggregateOutputType | null
    _sum: H2HRecordSumAggregateOutputType | null
    _min: H2HRecordMinAggregateOutputType | null
    _max: H2HRecordMaxAggregateOutputType | null
  }

  type GetH2HRecordGroupByPayload<T extends H2HRecordGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<H2HRecordGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof H2HRecordGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], H2HRecordGroupByOutputType[P]>
            : GetScalarType<T[P], H2HRecordGroupByOutputType[P]>
        }
      >
    >


  export type H2HRecordSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    homeTeamId?: boolean
    awayTeamId?: boolean
    totalMeetings?: boolean
    homeWins?: boolean
    awayWins?: boolean
    draws?: boolean
    totalGoals?: boolean
    avgGoalsPerGame?: boolean
    homeWinRate?: boolean
    awayWinRate?: boolean
    drawRate?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["h2HRecord"]>

  export type H2HRecordSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    homeTeamId?: boolean
    awayTeamId?: boolean
    totalMeetings?: boolean
    homeWins?: boolean
    awayWins?: boolean
    draws?: boolean
    totalGoals?: boolean
    avgGoalsPerGame?: boolean
    homeWinRate?: boolean
    awayWinRate?: boolean
    drawRate?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["h2HRecord"]>

  export type H2HRecordSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    homeTeamId?: boolean
    awayTeamId?: boolean
    totalMeetings?: boolean
    homeWins?: boolean
    awayWins?: boolean
    draws?: boolean
    totalGoals?: boolean
    avgGoalsPerGame?: boolean
    homeWinRate?: boolean
    awayWinRate?: boolean
    drawRate?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["h2HRecord"]>

  export type H2HRecordSelectScalar = {
    id?: boolean
    homeTeamId?: boolean
    awayTeamId?: boolean
    totalMeetings?: boolean
    homeWins?: boolean
    awayWins?: boolean
    draws?: boolean
    totalGoals?: boolean
    avgGoalsPerGame?: boolean
    homeWinRate?: boolean
    awayWinRate?: boolean
    drawRate?: boolean
    updatedAt?: boolean
  }

  export type H2HRecordOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "homeTeamId" | "awayTeamId" | "totalMeetings" | "homeWins" | "awayWins" | "draws" | "totalGoals" | "avgGoalsPerGame" | "homeWinRate" | "awayWinRate" | "drawRate" | "updatedAt", ExtArgs["result"]["h2HRecord"]>

  export type $H2HRecordPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "H2HRecord"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      homeTeamId: string
      awayTeamId: string
      totalMeetings: number
      homeWins: number
      awayWins: number
      draws: number
      totalGoals: number
      avgGoalsPerGame: number
      homeWinRate: number
      awayWinRate: number
      drawRate: number
      updatedAt: Date
    }, ExtArgs["result"]["h2HRecord"]>
    composites: {}
  }

  type H2HRecordGetPayload<S extends boolean | null | undefined | H2HRecordDefaultArgs> = $Result.GetResult<Prisma.$H2HRecordPayload, S>

  type H2HRecordCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<H2HRecordFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: H2HRecordCountAggregateInputType | true
    }

  export interface H2HRecordDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['H2HRecord'], meta: { name: 'H2HRecord' } }
    /**
     * Find zero or one H2HRecord that matches the filter.
     * @param {H2HRecordFindUniqueArgs} args - Arguments to find a H2HRecord
     * @example
     * // Get one H2HRecord
     * const h2HRecord = await prisma.h2HRecord.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends H2HRecordFindUniqueArgs>(args: SelectSubset<T, H2HRecordFindUniqueArgs<ExtArgs>>): Prisma__H2HRecordClient<$Result.GetResult<Prisma.$H2HRecordPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one H2HRecord that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {H2HRecordFindUniqueOrThrowArgs} args - Arguments to find a H2HRecord
     * @example
     * // Get one H2HRecord
     * const h2HRecord = await prisma.h2HRecord.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends H2HRecordFindUniqueOrThrowArgs>(args: SelectSubset<T, H2HRecordFindUniqueOrThrowArgs<ExtArgs>>): Prisma__H2HRecordClient<$Result.GetResult<Prisma.$H2HRecordPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first H2HRecord that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {H2HRecordFindFirstArgs} args - Arguments to find a H2HRecord
     * @example
     * // Get one H2HRecord
     * const h2HRecord = await prisma.h2HRecord.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends H2HRecordFindFirstArgs>(args?: SelectSubset<T, H2HRecordFindFirstArgs<ExtArgs>>): Prisma__H2HRecordClient<$Result.GetResult<Prisma.$H2HRecordPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first H2HRecord that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {H2HRecordFindFirstOrThrowArgs} args - Arguments to find a H2HRecord
     * @example
     * // Get one H2HRecord
     * const h2HRecord = await prisma.h2HRecord.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends H2HRecordFindFirstOrThrowArgs>(args?: SelectSubset<T, H2HRecordFindFirstOrThrowArgs<ExtArgs>>): Prisma__H2HRecordClient<$Result.GetResult<Prisma.$H2HRecordPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more H2HRecords that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {H2HRecordFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all H2HRecords
     * const h2HRecords = await prisma.h2HRecord.findMany()
     * 
     * // Get first 10 H2HRecords
     * const h2HRecords = await prisma.h2HRecord.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const h2HRecordWithIdOnly = await prisma.h2HRecord.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends H2HRecordFindManyArgs>(args?: SelectSubset<T, H2HRecordFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$H2HRecordPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a H2HRecord.
     * @param {H2HRecordCreateArgs} args - Arguments to create a H2HRecord.
     * @example
     * // Create one H2HRecord
     * const H2HRecord = await prisma.h2HRecord.create({
     *   data: {
     *     // ... data to create a H2HRecord
     *   }
     * })
     * 
     */
    create<T extends H2HRecordCreateArgs>(args: SelectSubset<T, H2HRecordCreateArgs<ExtArgs>>): Prisma__H2HRecordClient<$Result.GetResult<Prisma.$H2HRecordPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many H2HRecords.
     * @param {H2HRecordCreateManyArgs} args - Arguments to create many H2HRecords.
     * @example
     * // Create many H2HRecords
     * const h2HRecord = await prisma.h2HRecord.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends H2HRecordCreateManyArgs>(args?: SelectSubset<T, H2HRecordCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many H2HRecords and returns the data saved in the database.
     * @param {H2HRecordCreateManyAndReturnArgs} args - Arguments to create many H2HRecords.
     * @example
     * // Create many H2HRecords
     * const h2HRecord = await prisma.h2HRecord.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many H2HRecords and only return the `id`
     * const h2HRecordWithIdOnly = await prisma.h2HRecord.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends H2HRecordCreateManyAndReturnArgs>(args?: SelectSubset<T, H2HRecordCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$H2HRecordPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a H2HRecord.
     * @param {H2HRecordDeleteArgs} args - Arguments to delete one H2HRecord.
     * @example
     * // Delete one H2HRecord
     * const H2HRecord = await prisma.h2HRecord.delete({
     *   where: {
     *     // ... filter to delete one H2HRecord
     *   }
     * })
     * 
     */
    delete<T extends H2HRecordDeleteArgs>(args: SelectSubset<T, H2HRecordDeleteArgs<ExtArgs>>): Prisma__H2HRecordClient<$Result.GetResult<Prisma.$H2HRecordPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one H2HRecord.
     * @param {H2HRecordUpdateArgs} args - Arguments to update one H2HRecord.
     * @example
     * // Update one H2HRecord
     * const h2HRecord = await prisma.h2HRecord.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends H2HRecordUpdateArgs>(args: SelectSubset<T, H2HRecordUpdateArgs<ExtArgs>>): Prisma__H2HRecordClient<$Result.GetResult<Prisma.$H2HRecordPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more H2HRecords.
     * @param {H2HRecordDeleteManyArgs} args - Arguments to filter H2HRecords to delete.
     * @example
     * // Delete a few H2HRecords
     * const { count } = await prisma.h2HRecord.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends H2HRecordDeleteManyArgs>(args?: SelectSubset<T, H2HRecordDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more H2HRecords.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {H2HRecordUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many H2HRecords
     * const h2HRecord = await prisma.h2HRecord.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends H2HRecordUpdateManyArgs>(args: SelectSubset<T, H2HRecordUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more H2HRecords and returns the data updated in the database.
     * @param {H2HRecordUpdateManyAndReturnArgs} args - Arguments to update many H2HRecords.
     * @example
     * // Update many H2HRecords
     * const h2HRecord = await prisma.h2HRecord.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more H2HRecords and only return the `id`
     * const h2HRecordWithIdOnly = await prisma.h2HRecord.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends H2HRecordUpdateManyAndReturnArgs>(args: SelectSubset<T, H2HRecordUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$H2HRecordPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one H2HRecord.
     * @param {H2HRecordUpsertArgs} args - Arguments to update or create a H2HRecord.
     * @example
     * // Update or create a H2HRecord
     * const h2HRecord = await prisma.h2HRecord.upsert({
     *   create: {
     *     // ... data to create a H2HRecord
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the H2HRecord we want to update
     *   }
     * })
     */
    upsert<T extends H2HRecordUpsertArgs>(args: SelectSubset<T, H2HRecordUpsertArgs<ExtArgs>>): Prisma__H2HRecordClient<$Result.GetResult<Prisma.$H2HRecordPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of H2HRecords.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {H2HRecordCountArgs} args - Arguments to filter H2HRecords to count.
     * @example
     * // Count the number of H2HRecords
     * const count = await prisma.h2HRecord.count({
     *   where: {
     *     // ... the filter for the H2HRecords we want to count
     *   }
     * })
    **/
    count<T extends H2HRecordCountArgs>(
      args?: Subset<T, H2HRecordCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], H2HRecordCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a H2HRecord.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {H2HRecordAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends H2HRecordAggregateArgs>(args: Subset<T, H2HRecordAggregateArgs>): Prisma.PrismaPromise<GetH2HRecordAggregateType<T>>

    /**
     * Group by H2HRecord.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {H2HRecordGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends H2HRecordGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: H2HRecordGroupByArgs['orderBy'] }
        : { orderBy?: H2HRecordGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, H2HRecordGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetH2HRecordGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the H2HRecord model
   */
  readonly fields: H2HRecordFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for H2HRecord.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__H2HRecordClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the H2HRecord model
   */
  interface H2HRecordFieldRefs {
    readonly id: FieldRef<"H2HRecord", 'String'>
    readonly homeTeamId: FieldRef<"H2HRecord", 'String'>
    readonly awayTeamId: FieldRef<"H2HRecord", 'String'>
    readonly totalMeetings: FieldRef<"H2HRecord", 'Int'>
    readonly homeWins: FieldRef<"H2HRecord", 'Int'>
    readonly awayWins: FieldRef<"H2HRecord", 'Int'>
    readonly draws: FieldRef<"H2HRecord", 'Int'>
    readonly totalGoals: FieldRef<"H2HRecord", 'Int'>
    readonly avgGoalsPerGame: FieldRef<"H2HRecord", 'Float'>
    readonly homeWinRate: FieldRef<"H2HRecord", 'Float'>
    readonly awayWinRate: FieldRef<"H2HRecord", 'Float'>
    readonly drawRate: FieldRef<"H2HRecord", 'Float'>
    readonly updatedAt: FieldRef<"H2HRecord", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * H2HRecord findUnique
   */
  export type H2HRecordFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the H2HRecord
     */
    select?: H2HRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the H2HRecord
     */
    omit?: H2HRecordOmit<ExtArgs> | null
    /**
     * Filter, which H2HRecord to fetch.
     */
    where: H2HRecordWhereUniqueInput
  }

  /**
   * H2HRecord findUniqueOrThrow
   */
  export type H2HRecordFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the H2HRecord
     */
    select?: H2HRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the H2HRecord
     */
    omit?: H2HRecordOmit<ExtArgs> | null
    /**
     * Filter, which H2HRecord to fetch.
     */
    where: H2HRecordWhereUniqueInput
  }

  /**
   * H2HRecord findFirst
   */
  export type H2HRecordFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the H2HRecord
     */
    select?: H2HRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the H2HRecord
     */
    omit?: H2HRecordOmit<ExtArgs> | null
    /**
     * Filter, which H2HRecord to fetch.
     */
    where?: H2HRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of H2HRecords to fetch.
     */
    orderBy?: H2HRecordOrderByWithRelationInput | H2HRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for H2HRecords.
     */
    cursor?: H2HRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` H2HRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` H2HRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of H2HRecords.
     */
    distinct?: H2HRecordScalarFieldEnum | H2HRecordScalarFieldEnum[]
  }

  /**
   * H2HRecord findFirstOrThrow
   */
  export type H2HRecordFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the H2HRecord
     */
    select?: H2HRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the H2HRecord
     */
    omit?: H2HRecordOmit<ExtArgs> | null
    /**
     * Filter, which H2HRecord to fetch.
     */
    where?: H2HRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of H2HRecords to fetch.
     */
    orderBy?: H2HRecordOrderByWithRelationInput | H2HRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for H2HRecords.
     */
    cursor?: H2HRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` H2HRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` H2HRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of H2HRecords.
     */
    distinct?: H2HRecordScalarFieldEnum | H2HRecordScalarFieldEnum[]
  }

  /**
   * H2HRecord findMany
   */
  export type H2HRecordFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the H2HRecord
     */
    select?: H2HRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the H2HRecord
     */
    omit?: H2HRecordOmit<ExtArgs> | null
    /**
     * Filter, which H2HRecords to fetch.
     */
    where?: H2HRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of H2HRecords to fetch.
     */
    orderBy?: H2HRecordOrderByWithRelationInput | H2HRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing H2HRecords.
     */
    cursor?: H2HRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` H2HRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` H2HRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of H2HRecords.
     */
    distinct?: H2HRecordScalarFieldEnum | H2HRecordScalarFieldEnum[]
  }

  /**
   * H2HRecord create
   */
  export type H2HRecordCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the H2HRecord
     */
    select?: H2HRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the H2HRecord
     */
    omit?: H2HRecordOmit<ExtArgs> | null
    /**
     * The data needed to create a H2HRecord.
     */
    data: XOR<H2HRecordCreateInput, H2HRecordUncheckedCreateInput>
  }

  /**
   * H2HRecord createMany
   */
  export type H2HRecordCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many H2HRecords.
     */
    data: H2HRecordCreateManyInput | H2HRecordCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * H2HRecord createManyAndReturn
   */
  export type H2HRecordCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the H2HRecord
     */
    select?: H2HRecordSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the H2HRecord
     */
    omit?: H2HRecordOmit<ExtArgs> | null
    /**
     * The data used to create many H2HRecords.
     */
    data: H2HRecordCreateManyInput | H2HRecordCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * H2HRecord update
   */
  export type H2HRecordUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the H2HRecord
     */
    select?: H2HRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the H2HRecord
     */
    omit?: H2HRecordOmit<ExtArgs> | null
    /**
     * The data needed to update a H2HRecord.
     */
    data: XOR<H2HRecordUpdateInput, H2HRecordUncheckedUpdateInput>
    /**
     * Choose, which H2HRecord to update.
     */
    where: H2HRecordWhereUniqueInput
  }

  /**
   * H2HRecord updateMany
   */
  export type H2HRecordUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update H2HRecords.
     */
    data: XOR<H2HRecordUpdateManyMutationInput, H2HRecordUncheckedUpdateManyInput>
    /**
     * Filter which H2HRecords to update
     */
    where?: H2HRecordWhereInput
    /**
     * Limit how many H2HRecords to update.
     */
    limit?: number
  }

  /**
   * H2HRecord updateManyAndReturn
   */
  export type H2HRecordUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the H2HRecord
     */
    select?: H2HRecordSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the H2HRecord
     */
    omit?: H2HRecordOmit<ExtArgs> | null
    /**
     * The data used to update H2HRecords.
     */
    data: XOR<H2HRecordUpdateManyMutationInput, H2HRecordUncheckedUpdateManyInput>
    /**
     * Filter which H2HRecords to update
     */
    where?: H2HRecordWhereInput
    /**
     * Limit how many H2HRecords to update.
     */
    limit?: number
  }

  /**
   * H2HRecord upsert
   */
  export type H2HRecordUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the H2HRecord
     */
    select?: H2HRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the H2HRecord
     */
    omit?: H2HRecordOmit<ExtArgs> | null
    /**
     * The filter to search for the H2HRecord to update in case it exists.
     */
    where: H2HRecordWhereUniqueInput
    /**
     * In case the H2HRecord found by the `where` argument doesn't exist, create a new H2HRecord with this data.
     */
    create: XOR<H2HRecordCreateInput, H2HRecordUncheckedCreateInput>
    /**
     * In case the H2HRecord was found with the provided `where` argument, update it with this data.
     */
    update: XOR<H2HRecordUpdateInput, H2HRecordUncheckedUpdateInput>
  }

  /**
   * H2HRecord delete
   */
  export type H2HRecordDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the H2HRecord
     */
    select?: H2HRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the H2HRecord
     */
    omit?: H2HRecordOmit<ExtArgs> | null
    /**
     * Filter which H2HRecord to delete.
     */
    where: H2HRecordWhereUniqueInput
  }

  /**
   * H2HRecord deleteMany
   */
  export type H2HRecordDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which H2HRecords to delete
     */
    where?: H2HRecordWhereInput
    /**
     * Limit how many H2HRecords to delete.
     */
    limit?: number
  }

  /**
   * H2HRecord without action
   */
  export type H2HRecordDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the H2HRecord
     */
    select?: H2HRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the H2HRecord
     */
    omit?: H2HRecordOmit<ExtArgs> | null
  }


  /**
   * Model TeamStrength
   */

  export type AggregateTeamStrength = {
    _count: TeamStrengthCountAggregateOutputType | null
    _avg: TeamStrengthAvgAggregateOutputType | null
    _sum: TeamStrengthSumAggregateOutputType | null
    _min: TeamStrengthMinAggregateOutputType | null
    _max: TeamStrengthMaxAggregateOutputType | null
  }

  export type TeamStrengthAvgAggregateOutputType = {
    attackStrength: number | null
    defenceStrength: number | null
    overallStrength: number | null
    homeStrength: number | null
    awayStrength: number | null
    formPoints: number | null
    gamesPlayed: number | null
  }

  export type TeamStrengthSumAggregateOutputType = {
    attackStrength: number | null
    defenceStrength: number | null
    overallStrength: number | null
    homeStrength: number | null
    awayStrength: number | null
    formPoints: number | null
    gamesPlayed: number | null
  }

  export type TeamStrengthMinAggregateOutputType = {
    id: string | null
    teamId: string | null
    teamName: string | null
    leagueId: string | null
    attackStrength: number | null
    defenceStrength: number | null
    overallStrength: number | null
    homeStrength: number | null
    awayStrength: number | null
    formPoints: number | null
    formString: string | null
    gamesPlayed: number | null
    updatedAt: Date | null
  }

  export type TeamStrengthMaxAggregateOutputType = {
    id: string | null
    teamId: string | null
    teamName: string | null
    leagueId: string | null
    attackStrength: number | null
    defenceStrength: number | null
    overallStrength: number | null
    homeStrength: number | null
    awayStrength: number | null
    formPoints: number | null
    formString: string | null
    gamesPlayed: number | null
    updatedAt: Date | null
  }

  export type TeamStrengthCountAggregateOutputType = {
    id: number
    teamId: number
    teamName: number
    leagueId: number
    attackStrength: number
    defenceStrength: number
    overallStrength: number
    homeStrength: number
    awayStrength: number
    formPoints: number
    formString: number
    gamesPlayed: number
    updatedAt: number
    _all: number
  }


  export type TeamStrengthAvgAggregateInputType = {
    attackStrength?: true
    defenceStrength?: true
    overallStrength?: true
    homeStrength?: true
    awayStrength?: true
    formPoints?: true
    gamesPlayed?: true
  }

  export type TeamStrengthSumAggregateInputType = {
    attackStrength?: true
    defenceStrength?: true
    overallStrength?: true
    homeStrength?: true
    awayStrength?: true
    formPoints?: true
    gamesPlayed?: true
  }

  export type TeamStrengthMinAggregateInputType = {
    id?: true
    teamId?: true
    teamName?: true
    leagueId?: true
    attackStrength?: true
    defenceStrength?: true
    overallStrength?: true
    homeStrength?: true
    awayStrength?: true
    formPoints?: true
    formString?: true
    gamesPlayed?: true
    updatedAt?: true
  }

  export type TeamStrengthMaxAggregateInputType = {
    id?: true
    teamId?: true
    teamName?: true
    leagueId?: true
    attackStrength?: true
    defenceStrength?: true
    overallStrength?: true
    homeStrength?: true
    awayStrength?: true
    formPoints?: true
    formString?: true
    gamesPlayed?: true
    updatedAt?: true
  }

  export type TeamStrengthCountAggregateInputType = {
    id?: true
    teamId?: true
    teamName?: true
    leagueId?: true
    attackStrength?: true
    defenceStrength?: true
    overallStrength?: true
    homeStrength?: true
    awayStrength?: true
    formPoints?: true
    formString?: true
    gamesPlayed?: true
    updatedAt?: true
    _all?: true
  }

  export type TeamStrengthAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TeamStrength to aggregate.
     */
    where?: TeamStrengthWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TeamStrengths to fetch.
     */
    orderBy?: TeamStrengthOrderByWithRelationInput | TeamStrengthOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TeamStrengthWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TeamStrengths from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TeamStrengths.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TeamStrengths
    **/
    _count?: true | TeamStrengthCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TeamStrengthAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TeamStrengthSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TeamStrengthMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TeamStrengthMaxAggregateInputType
  }

  export type GetTeamStrengthAggregateType<T extends TeamStrengthAggregateArgs> = {
        [P in keyof T & keyof AggregateTeamStrength]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTeamStrength[P]>
      : GetScalarType<T[P], AggregateTeamStrength[P]>
  }




  export type TeamStrengthGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TeamStrengthWhereInput
    orderBy?: TeamStrengthOrderByWithAggregationInput | TeamStrengthOrderByWithAggregationInput[]
    by: TeamStrengthScalarFieldEnum[] | TeamStrengthScalarFieldEnum
    having?: TeamStrengthScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TeamStrengthCountAggregateInputType | true
    _avg?: TeamStrengthAvgAggregateInputType
    _sum?: TeamStrengthSumAggregateInputType
    _min?: TeamStrengthMinAggregateInputType
    _max?: TeamStrengthMaxAggregateInputType
  }

  export type TeamStrengthGroupByOutputType = {
    id: string
    teamId: string
    teamName: string
    leagueId: string
    attackStrength: number
    defenceStrength: number
    overallStrength: number
    homeStrength: number
    awayStrength: number
    formPoints: number
    formString: string | null
    gamesPlayed: number
    updatedAt: Date
    _count: TeamStrengthCountAggregateOutputType | null
    _avg: TeamStrengthAvgAggregateOutputType | null
    _sum: TeamStrengthSumAggregateOutputType | null
    _min: TeamStrengthMinAggregateOutputType | null
    _max: TeamStrengthMaxAggregateOutputType | null
  }

  type GetTeamStrengthGroupByPayload<T extends TeamStrengthGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TeamStrengthGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TeamStrengthGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TeamStrengthGroupByOutputType[P]>
            : GetScalarType<T[P], TeamStrengthGroupByOutputType[P]>
        }
      >
    >


  export type TeamStrengthSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    teamId?: boolean
    teamName?: boolean
    leagueId?: boolean
    attackStrength?: boolean
    defenceStrength?: boolean
    overallStrength?: boolean
    homeStrength?: boolean
    awayStrength?: boolean
    formPoints?: boolean
    formString?: boolean
    gamesPlayed?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["teamStrength"]>

  export type TeamStrengthSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    teamId?: boolean
    teamName?: boolean
    leagueId?: boolean
    attackStrength?: boolean
    defenceStrength?: boolean
    overallStrength?: boolean
    homeStrength?: boolean
    awayStrength?: boolean
    formPoints?: boolean
    formString?: boolean
    gamesPlayed?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["teamStrength"]>

  export type TeamStrengthSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    teamId?: boolean
    teamName?: boolean
    leagueId?: boolean
    attackStrength?: boolean
    defenceStrength?: boolean
    overallStrength?: boolean
    homeStrength?: boolean
    awayStrength?: boolean
    formPoints?: boolean
    formString?: boolean
    gamesPlayed?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["teamStrength"]>

  export type TeamStrengthSelectScalar = {
    id?: boolean
    teamId?: boolean
    teamName?: boolean
    leagueId?: boolean
    attackStrength?: boolean
    defenceStrength?: boolean
    overallStrength?: boolean
    homeStrength?: boolean
    awayStrength?: boolean
    formPoints?: boolean
    formString?: boolean
    gamesPlayed?: boolean
    updatedAt?: boolean
  }

  export type TeamStrengthOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "teamId" | "teamName" | "leagueId" | "attackStrength" | "defenceStrength" | "overallStrength" | "homeStrength" | "awayStrength" | "formPoints" | "formString" | "gamesPlayed" | "updatedAt", ExtArgs["result"]["teamStrength"]>

  export type $TeamStrengthPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TeamStrength"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      teamId: string
      teamName: string
      leagueId: string
      attackStrength: number
      defenceStrength: number
      overallStrength: number
      homeStrength: number
      awayStrength: number
      formPoints: number
      formString: string | null
      gamesPlayed: number
      updatedAt: Date
    }, ExtArgs["result"]["teamStrength"]>
    composites: {}
  }

  type TeamStrengthGetPayload<S extends boolean | null | undefined | TeamStrengthDefaultArgs> = $Result.GetResult<Prisma.$TeamStrengthPayload, S>

  type TeamStrengthCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TeamStrengthFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TeamStrengthCountAggregateInputType | true
    }

  export interface TeamStrengthDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TeamStrength'], meta: { name: 'TeamStrength' } }
    /**
     * Find zero or one TeamStrength that matches the filter.
     * @param {TeamStrengthFindUniqueArgs} args - Arguments to find a TeamStrength
     * @example
     * // Get one TeamStrength
     * const teamStrength = await prisma.teamStrength.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TeamStrengthFindUniqueArgs>(args: SelectSubset<T, TeamStrengthFindUniqueArgs<ExtArgs>>): Prisma__TeamStrengthClient<$Result.GetResult<Prisma.$TeamStrengthPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TeamStrength that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TeamStrengthFindUniqueOrThrowArgs} args - Arguments to find a TeamStrength
     * @example
     * // Get one TeamStrength
     * const teamStrength = await prisma.teamStrength.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TeamStrengthFindUniqueOrThrowArgs>(args: SelectSubset<T, TeamStrengthFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TeamStrengthClient<$Result.GetResult<Prisma.$TeamStrengthPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TeamStrength that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamStrengthFindFirstArgs} args - Arguments to find a TeamStrength
     * @example
     * // Get one TeamStrength
     * const teamStrength = await prisma.teamStrength.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TeamStrengthFindFirstArgs>(args?: SelectSubset<T, TeamStrengthFindFirstArgs<ExtArgs>>): Prisma__TeamStrengthClient<$Result.GetResult<Prisma.$TeamStrengthPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TeamStrength that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamStrengthFindFirstOrThrowArgs} args - Arguments to find a TeamStrength
     * @example
     * // Get one TeamStrength
     * const teamStrength = await prisma.teamStrength.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TeamStrengthFindFirstOrThrowArgs>(args?: SelectSubset<T, TeamStrengthFindFirstOrThrowArgs<ExtArgs>>): Prisma__TeamStrengthClient<$Result.GetResult<Prisma.$TeamStrengthPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TeamStrengths that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamStrengthFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TeamStrengths
     * const teamStrengths = await prisma.teamStrength.findMany()
     * 
     * // Get first 10 TeamStrengths
     * const teamStrengths = await prisma.teamStrength.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const teamStrengthWithIdOnly = await prisma.teamStrength.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TeamStrengthFindManyArgs>(args?: SelectSubset<T, TeamStrengthFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamStrengthPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TeamStrength.
     * @param {TeamStrengthCreateArgs} args - Arguments to create a TeamStrength.
     * @example
     * // Create one TeamStrength
     * const TeamStrength = await prisma.teamStrength.create({
     *   data: {
     *     // ... data to create a TeamStrength
     *   }
     * })
     * 
     */
    create<T extends TeamStrengthCreateArgs>(args: SelectSubset<T, TeamStrengthCreateArgs<ExtArgs>>): Prisma__TeamStrengthClient<$Result.GetResult<Prisma.$TeamStrengthPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TeamStrengths.
     * @param {TeamStrengthCreateManyArgs} args - Arguments to create many TeamStrengths.
     * @example
     * // Create many TeamStrengths
     * const teamStrength = await prisma.teamStrength.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TeamStrengthCreateManyArgs>(args?: SelectSubset<T, TeamStrengthCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TeamStrengths and returns the data saved in the database.
     * @param {TeamStrengthCreateManyAndReturnArgs} args - Arguments to create many TeamStrengths.
     * @example
     * // Create many TeamStrengths
     * const teamStrength = await prisma.teamStrength.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TeamStrengths and only return the `id`
     * const teamStrengthWithIdOnly = await prisma.teamStrength.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TeamStrengthCreateManyAndReturnArgs>(args?: SelectSubset<T, TeamStrengthCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamStrengthPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TeamStrength.
     * @param {TeamStrengthDeleteArgs} args - Arguments to delete one TeamStrength.
     * @example
     * // Delete one TeamStrength
     * const TeamStrength = await prisma.teamStrength.delete({
     *   where: {
     *     // ... filter to delete one TeamStrength
     *   }
     * })
     * 
     */
    delete<T extends TeamStrengthDeleteArgs>(args: SelectSubset<T, TeamStrengthDeleteArgs<ExtArgs>>): Prisma__TeamStrengthClient<$Result.GetResult<Prisma.$TeamStrengthPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TeamStrength.
     * @param {TeamStrengthUpdateArgs} args - Arguments to update one TeamStrength.
     * @example
     * // Update one TeamStrength
     * const teamStrength = await prisma.teamStrength.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TeamStrengthUpdateArgs>(args: SelectSubset<T, TeamStrengthUpdateArgs<ExtArgs>>): Prisma__TeamStrengthClient<$Result.GetResult<Prisma.$TeamStrengthPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TeamStrengths.
     * @param {TeamStrengthDeleteManyArgs} args - Arguments to filter TeamStrengths to delete.
     * @example
     * // Delete a few TeamStrengths
     * const { count } = await prisma.teamStrength.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TeamStrengthDeleteManyArgs>(args?: SelectSubset<T, TeamStrengthDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TeamStrengths.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamStrengthUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TeamStrengths
     * const teamStrength = await prisma.teamStrength.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TeamStrengthUpdateManyArgs>(args: SelectSubset<T, TeamStrengthUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TeamStrengths and returns the data updated in the database.
     * @param {TeamStrengthUpdateManyAndReturnArgs} args - Arguments to update many TeamStrengths.
     * @example
     * // Update many TeamStrengths
     * const teamStrength = await prisma.teamStrength.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TeamStrengths and only return the `id`
     * const teamStrengthWithIdOnly = await prisma.teamStrength.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TeamStrengthUpdateManyAndReturnArgs>(args: SelectSubset<T, TeamStrengthUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamStrengthPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TeamStrength.
     * @param {TeamStrengthUpsertArgs} args - Arguments to update or create a TeamStrength.
     * @example
     * // Update or create a TeamStrength
     * const teamStrength = await prisma.teamStrength.upsert({
     *   create: {
     *     // ... data to create a TeamStrength
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TeamStrength we want to update
     *   }
     * })
     */
    upsert<T extends TeamStrengthUpsertArgs>(args: SelectSubset<T, TeamStrengthUpsertArgs<ExtArgs>>): Prisma__TeamStrengthClient<$Result.GetResult<Prisma.$TeamStrengthPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TeamStrengths.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamStrengthCountArgs} args - Arguments to filter TeamStrengths to count.
     * @example
     * // Count the number of TeamStrengths
     * const count = await prisma.teamStrength.count({
     *   where: {
     *     // ... the filter for the TeamStrengths we want to count
     *   }
     * })
    **/
    count<T extends TeamStrengthCountArgs>(
      args?: Subset<T, TeamStrengthCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TeamStrengthCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TeamStrength.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamStrengthAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TeamStrengthAggregateArgs>(args: Subset<T, TeamStrengthAggregateArgs>): Prisma.PrismaPromise<GetTeamStrengthAggregateType<T>>

    /**
     * Group by TeamStrength.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamStrengthGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TeamStrengthGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TeamStrengthGroupByArgs['orderBy'] }
        : { orderBy?: TeamStrengthGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TeamStrengthGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTeamStrengthGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TeamStrength model
   */
  readonly fields: TeamStrengthFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TeamStrength.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TeamStrengthClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TeamStrength model
   */
  interface TeamStrengthFieldRefs {
    readonly id: FieldRef<"TeamStrength", 'String'>
    readonly teamId: FieldRef<"TeamStrength", 'String'>
    readonly teamName: FieldRef<"TeamStrength", 'String'>
    readonly leagueId: FieldRef<"TeamStrength", 'String'>
    readonly attackStrength: FieldRef<"TeamStrength", 'Float'>
    readonly defenceStrength: FieldRef<"TeamStrength", 'Float'>
    readonly overallStrength: FieldRef<"TeamStrength", 'Float'>
    readonly homeStrength: FieldRef<"TeamStrength", 'Float'>
    readonly awayStrength: FieldRef<"TeamStrength", 'Float'>
    readonly formPoints: FieldRef<"TeamStrength", 'Int'>
    readonly formString: FieldRef<"TeamStrength", 'String'>
    readonly gamesPlayed: FieldRef<"TeamStrength", 'Int'>
    readonly updatedAt: FieldRef<"TeamStrength", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TeamStrength findUnique
   */
  export type TeamStrengthFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamStrength
     */
    select?: TeamStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamStrength
     */
    omit?: TeamStrengthOmit<ExtArgs> | null
    /**
     * Filter, which TeamStrength to fetch.
     */
    where: TeamStrengthWhereUniqueInput
  }

  /**
   * TeamStrength findUniqueOrThrow
   */
  export type TeamStrengthFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamStrength
     */
    select?: TeamStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamStrength
     */
    omit?: TeamStrengthOmit<ExtArgs> | null
    /**
     * Filter, which TeamStrength to fetch.
     */
    where: TeamStrengthWhereUniqueInput
  }

  /**
   * TeamStrength findFirst
   */
  export type TeamStrengthFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamStrength
     */
    select?: TeamStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamStrength
     */
    omit?: TeamStrengthOmit<ExtArgs> | null
    /**
     * Filter, which TeamStrength to fetch.
     */
    where?: TeamStrengthWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TeamStrengths to fetch.
     */
    orderBy?: TeamStrengthOrderByWithRelationInput | TeamStrengthOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TeamStrengths.
     */
    cursor?: TeamStrengthWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TeamStrengths from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TeamStrengths.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TeamStrengths.
     */
    distinct?: TeamStrengthScalarFieldEnum | TeamStrengthScalarFieldEnum[]
  }

  /**
   * TeamStrength findFirstOrThrow
   */
  export type TeamStrengthFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamStrength
     */
    select?: TeamStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamStrength
     */
    omit?: TeamStrengthOmit<ExtArgs> | null
    /**
     * Filter, which TeamStrength to fetch.
     */
    where?: TeamStrengthWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TeamStrengths to fetch.
     */
    orderBy?: TeamStrengthOrderByWithRelationInput | TeamStrengthOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TeamStrengths.
     */
    cursor?: TeamStrengthWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TeamStrengths from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TeamStrengths.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TeamStrengths.
     */
    distinct?: TeamStrengthScalarFieldEnum | TeamStrengthScalarFieldEnum[]
  }

  /**
   * TeamStrength findMany
   */
  export type TeamStrengthFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamStrength
     */
    select?: TeamStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamStrength
     */
    omit?: TeamStrengthOmit<ExtArgs> | null
    /**
     * Filter, which TeamStrengths to fetch.
     */
    where?: TeamStrengthWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TeamStrengths to fetch.
     */
    orderBy?: TeamStrengthOrderByWithRelationInput | TeamStrengthOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TeamStrengths.
     */
    cursor?: TeamStrengthWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TeamStrengths from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TeamStrengths.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TeamStrengths.
     */
    distinct?: TeamStrengthScalarFieldEnum | TeamStrengthScalarFieldEnum[]
  }

  /**
   * TeamStrength create
   */
  export type TeamStrengthCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamStrength
     */
    select?: TeamStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamStrength
     */
    omit?: TeamStrengthOmit<ExtArgs> | null
    /**
     * The data needed to create a TeamStrength.
     */
    data: XOR<TeamStrengthCreateInput, TeamStrengthUncheckedCreateInput>
  }

  /**
   * TeamStrength createMany
   */
  export type TeamStrengthCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TeamStrengths.
     */
    data: TeamStrengthCreateManyInput | TeamStrengthCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TeamStrength createManyAndReturn
   */
  export type TeamStrengthCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamStrength
     */
    select?: TeamStrengthSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TeamStrength
     */
    omit?: TeamStrengthOmit<ExtArgs> | null
    /**
     * The data used to create many TeamStrengths.
     */
    data: TeamStrengthCreateManyInput | TeamStrengthCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TeamStrength update
   */
  export type TeamStrengthUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamStrength
     */
    select?: TeamStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamStrength
     */
    omit?: TeamStrengthOmit<ExtArgs> | null
    /**
     * The data needed to update a TeamStrength.
     */
    data: XOR<TeamStrengthUpdateInput, TeamStrengthUncheckedUpdateInput>
    /**
     * Choose, which TeamStrength to update.
     */
    where: TeamStrengthWhereUniqueInput
  }

  /**
   * TeamStrength updateMany
   */
  export type TeamStrengthUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TeamStrengths.
     */
    data: XOR<TeamStrengthUpdateManyMutationInput, TeamStrengthUncheckedUpdateManyInput>
    /**
     * Filter which TeamStrengths to update
     */
    where?: TeamStrengthWhereInput
    /**
     * Limit how many TeamStrengths to update.
     */
    limit?: number
  }

  /**
   * TeamStrength updateManyAndReturn
   */
  export type TeamStrengthUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamStrength
     */
    select?: TeamStrengthSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TeamStrength
     */
    omit?: TeamStrengthOmit<ExtArgs> | null
    /**
     * The data used to update TeamStrengths.
     */
    data: XOR<TeamStrengthUpdateManyMutationInput, TeamStrengthUncheckedUpdateManyInput>
    /**
     * Filter which TeamStrengths to update
     */
    where?: TeamStrengthWhereInput
    /**
     * Limit how many TeamStrengths to update.
     */
    limit?: number
  }

  /**
   * TeamStrength upsert
   */
  export type TeamStrengthUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamStrength
     */
    select?: TeamStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamStrength
     */
    omit?: TeamStrengthOmit<ExtArgs> | null
    /**
     * The filter to search for the TeamStrength to update in case it exists.
     */
    where: TeamStrengthWhereUniqueInput
    /**
     * In case the TeamStrength found by the `where` argument doesn't exist, create a new TeamStrength with this data.
     */
    create: XOR<TeamStrengthCreateInput, TeamStrengthUncheckedCreateInput>
    /**
     * In case the TeamStrength was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TeamStrengthUpdateInput, TeamStrengthUncheckedUpdateInput>
  }

  /**
   * TeamStrength delete
   */
  export type TeamStrengthDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamStrength
     */
    select?: TeamStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamStrength
     */
    omit?: TeamStrengthOmit<ExtArgs> | null
    /**
     * Filter which TeamStrength to delete.
     */
    where: TeamStrengthWhereUniqueInput
  }

  /**
   * TeamStrength deleteMany
   */
  export type TeamStrengthDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TeamStrengths to delete
     */
    where?: TeamStrengthWhereInput
    /**
     * Limit how many TeamStrengths to delete.
     */
    limit?: number
  }

  /**
   * TeamStrength without action
   */
  export type TeamStrengthDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamStrength
     */
    select?: TeamStrengthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamStrength
     */
    omit?: TeamStrengthOmit<ExtArgs> | null
  }


  /**
   * Model ConfidenceScore
   */

  export type AggregateConfidenceScore = {
    _count: ConfidenceScoreCountAggregateOutputType | null
    _avg: ConfidenceScoreAvgAggregateOutputType | null
    _sum: ConfidenceScoreSumAggregateOutputType | null
    _min: ConfidenceScoreMinAggregateOutputType | null
    _max: ConfidenceScoreMaxAggregateOutputType | null
  }

  export type ConfidenceScoreAvgAggregateOutputType = {
    formScore: number | null
    homeAwayScore: number | null
    h2hScore: number | null
    goalTrendScore: number | null
    oddsScore: number | null
    teamStrengthScore: number | null
    grooveScore: number | null
    confidence: number | null
    impliedProbability: number | null
    realProbability: number | null
    valueEdge: number | null
  }

  export type ConfidenceScoreSumAggregateOutputType = {
    formScore: number | null
    homeAwayScore: number | null
    h2hScore: number | null
    goalTrendScore: number | null
    oddsScore: number | null
    teamStrengthScore: number | null
    grooveScore: number | null
    confidence: number | null
    impliedProbability: number | null
    realProbability: number | null
    valueEdge: number | null
  }

  export type ConfidenceScoreMinAggregateOutputType = {
    id: string | null
    fixtureId: string | null
    pick: string | null
    market: string | null
    formScore: number | null
    homeAwayScore: number | null
    h2hScore: number | null
    goalTrendScore: number | null
    oddsScore: number | null
    teamStrengthScore: number | null
    grooveScore: number | null
    riskLevel: $Enums.RiskLevel | null
    confidence: number | null
    impliedProbability: number | null
    realProbability: number | null
    valueEdge: number | null
    calculatedAt: Date | null
  }

  export type ConfidenceScoreMaxAggregateOutputType = {
    id: string | null
    fixtureId: string | null
    pick: string | null
    market: string | null
    formScore: number | null
    homeAwayScore: number | null
    h2hScore: number | null
    goalTrendScore: number | null
    oddsScore: number | null
    teamStrengthScore: number | null
    grooveScore: number | null
    riskLevel: $Enums.RiskLevel | null
    confidence: number | null
    impliedProbability: number | null
    realProbability: number | null
    valueEdge: number | null
    calculatedAt: Date | null
  }

  export type ConfidenceScoreCountAggregateOutputType = {
    id: number
    fixtureId: number
    pick: number
    market: number
    formScore: number
    homeAwayScore: number
    h2hScore: number
    goalTrendScore: number
    oddsScore: number
    teamStrengthScore: number
    grooveScore: number
    riskLevel: number
    confidence: number
    impliedProbability: number
    realProbability: number
    valueEdge: number
    calculatedAt: number
    _all: number
  }


  export type ConfidenceScoreAvgAggregateInputType = {
    formScore?: true
    homeAwayScore?: true
    h2hScore?: true
    goalTrendScore?: true
    oddsScore?: true
    teamStrengthScore?: true
    grooveScore?: true
    confidence?: true
    impliedProbability?: true
    realProbability?: true
    valueEdge?: true
  }

  export type ConfidenceScoreSumAggregateInputType = {
    formScore?: true
    homeAwayScore?: true
    h2hScore?: true
    goalTrendScore?: true
    oddsScore?: true
    teamStrengthScore?: true
    grooveScore?: true
    confidence?: true
    impliedProbability?: true
    realProbability?: true
    valueEdge?: true
  }

  export type ConfidenceScoreMinAggregateInputType = {
    id?: true
    fixtureId?: true
    pick?: true
    market?: true
    formScore?: true
    homeAwayScore?: true
    h2hScore?: true
    goalTrendScore?: true
    oddsScore?: true
    teamStrengthScore?: true
    grooveScore?: true
    riskLevel?: true
    confidence?: true
    impliedProbability?: true
    realProbability?: true
    valueEdge?: true
    calculatedAt?: true
  }

  export type ConfidenceScoreMaxAggregateInputType = {
    id?: true
    fixtureId?: true
    pick?: true
    market?: true
    formScore?: true
    homeAwayScore?: true
    h2hScore?: true
    goalTrendScore?: true
    oddsScore?: true
    teamStrengthScore?: true
    grooveScore?: true
    riskLevel?: true
    confidence?: true
    impliedProbability?: true
    realProbability?: true
    valueEdge?: true
    calculatedAt?: true
  }

  export type ConfidenceScoreCountAggregateInputType = {
    id?: true
    fixtureId?: true
    pick?: true
    market?: true
    formScore?: true
    homeAwayScore?: true
    h2hScore?: true
    goalTrendScore?: true
    oddsScore?: true
    teamStrengthScore?: true
    grooveScore?: true
    riskLevel?: true
    confidence?: true
    impliedProbability?: true
    realProbability?: true
    valueEdge?: true
    calculatedAt?: true
    _all?: true
  }

  export type ConfidenceScoreAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ConfidenceScore to aggregate.
     */
    where?: ConfidenceScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConfidenceScores to fetch.
     */
    orderBy?: ConfidenceScoreOrderByWithRelationInput | ConfidenceScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ConfidenceScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConfidenceScores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConfidenceScores.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ConfidenceScores
    **/
    _count?: true | ConfidenceScoreCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ConfidenceScoreAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ConfidenceScoreSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ConfidenceScoreMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ConfidenceScoreMaxAggregateInputType
  }

  export type GetConfidenceScoreAggregateType<T extends ConfidenceScoreAggregateArgs> = {
        [P in keyof T & keyof AggregateConfidenceScore]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateConfidenceScore[P]>
      : GetScalarType<T[P], AggregateConfidenceScore[P]>
  }




  export type ConfidenceScoreGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConfidenceScoreWhereInput
    orderBy?: ConfidenceScoreOrderByWithAggregationInput | ConfidenceScoreOrderByWithAggregationInput[]
    by: ConfidenceScoreScalarFieldEnum[] | ConfidenceScoreScalarFieldEnum
    having?: ConfidenceScoreScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ConfidenceScoreCountAggregateInputType | true
    _avg?: ConfidenceScoreAvgAggregateInputType
    _sum?: ConfidenceScoreSumAggregateInputType
    _min?: ConfidenceScoreMinAggregateInputType
    _max?: ConfidenceScoreMaxAggregateInputType
  }

  export type ConfidenceScoreGroupByOutputType = {
    id: string
    fixtureId: string
    pick: string
    market: string
    formScore: number
    homeAwayScore: number
    h2hScore: number
    goalTrendScore: number
    oddsScore: number
    teamStrengthScore: number
    grooveScore: number
    riskLevel: $Enums.RiskLevel
    confidence: number
    impliedProbability: number
    realProbability: number
    valueEdge: number
    calculatedAt: Date
    _count: ConfidenceScoreCountAggregateOutputType | null
    _avg: ConfidenceScoreAvgAggregateOutputType | null
    _sum: ConfidenceScoreSumAggregateOutputType | null
    _min: ConfidenceScoreMinAggregateOutputType | null
    _max: ConfidenceScoreMaxAggregateOutputType | null
  }

  type GetConfidenceScoreGroupByPayload<T extends ConfidenceScoreGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ConfidenceScoreGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ConfidenceScoreGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ConfidenceScoreGroupByOutputType[P]>
            : GetScalarType<T[P], ConfidenceScoreGroupByOutputType[P]>
        }
      >
    >


  export type ConfidenceScoreSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fixtureId?: boolean
    pick?: boolean
    market?: boolean
    formScore?: boolean
    homeAwayScore?: boolean
    h2hScore?: boolean
    goalTrendScore?: boolean
    oddsScore?: boolean
    teamStrengthScore?: boolean
    grooveScore?: boolean
    riskLevel?: boolean
    confidence?: boolean
    impliedProbability?: boolean
    realProbability?: boolean
    valueEdge?: boolean
    calculatedAt?: boolean
    fixture?: boolean | FixtureDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["confidenceScore"]>

  export type ConfidenceScoreSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fixtureId?: boolean
    pick?: boolean
    market?: boolean
    formScore?: boolean
    homeAwayScore?: boolean
    h2hScore?: boolean
    goalTrendScore?: boolean
    oddsScore?: boolean
    teamStrengthScore?: boolean
    grooveScore?: boolean
    riskLevel?: boolean
    confidence?: boolean
    impliedProbability?: boolean
    realProbability?: boolean
    valueEdge?: boolean
    calculatedAt?: boolean
    fixture?: boolean | FixtureDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["confidenceScore"]>

  export type ConfidenceScoreSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fixtureId?: boolean
    pick?: boolean
    market?: boolean
    formScore?: boolean
    homeAwayScore?: boolean
    h2hScore?: boolean
    goalTrendScore?: boolean
    oddsScore?: boolean
    teamStrengthScore?: boolean
    grooveScore?: boolean
    riskLevel?: boolean
    confidence?: boolean
    impliedProbability?: boolean
    realProbability?: boolean
    valueEdge?: boolean
    calculatedAt?: boolean
    fixture?: boolean | FixtureDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["confidenceScore"]>

  export type ConfidenceScoreSelectScalar = {
    id?: boolean
    fixtureId?: boolean
    pick?: boolean
    market?: boolean
    formScore?: boolean
    homeAwayScore?: boolean
    h2hScore?: boolean
    goalTrendScore?: boolean
    oddsScore?: boolean
    teamStrengthScore?: boolean
    grooveScore?: boolean
    riskLevel?: boolean
    confidence?: boolean
    impliedProbability?: boolean
    realProbability?: boolean
    valueEdge?: boolean
    calculatedAt?: boolean
  }

  export type ConfidenceScoreOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "fixtureId" | "pick" | "market" | "formScore" | "homeAwayScore" | "h2hScore" | "goalTrendScore" | "oddsScore" | "teamStrengthScore" | "grooveScore" | "riskLevel" | "confidence" | "impliedProbability" | "realProbability" | "valueEdge" | "calculatedAt", ExtArgs["result"]["confidenceScore"]>
  export type ConfidenceScoreInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    fixture?: boolean | FixtureDefaultArgs<ExtArgs>
  }
  export type ConfidenceScoreIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    fixture?: boolean | FixtureDefaultArgs<ExtArgs>
  }
  export type ConfidenceScoreIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    fixture?: boolean | FixtureDefaultArgs<ExtArgs>
  }

  export type $ConfidenceScorePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ConfidenceScore"
    objects: {
      fixture: Prisma.$FixturePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      fixtureId: string
      pick: string
      market: string
      formScore: number
      homeAwayScore: number
      h2hScore: number
      goalTrendScore: number
      oddsScore: number
      teamStrengthScore: number
      grooveScore: number
      riskLevel: $Enums.RiskLevel
      confidence: number
      impliedProbability: number
      realProbability: number
      valueEdge: number
      calculatedAt: Date
    }, ExtArgs["result"]["confidenceScore"]>
    composites: {}
  }

  type ConfidenceScoreGetPayload<S extends boolean | null | undefined | ConfidenceScoreDefaultArgs> = $Result.GetResult<Prisma.$ConfidenceScorePayload, S>

  type ConfidenceScoreCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ConfidenceScoreFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ConfidenceScoreCountAggregateInputType | true
    }

  export interface ConfidenceScoreDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ConfidenceScore'], meta: { name: 'ConfidenceScore' } }
    /**
     * Find zero or one ConfidenceScore that matches the filter.
     * @param {ConfidenceScoreFindUniqueArgs} args - Arguments to find a ConfidenceScore
     * @example
     * // Get one ConfidenceScore
     * const confidenceScore = await prisma.confidenceScore.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ConfidenceScoreFindUniqueArgs>(args: SelectSubset<T, ConfidenceScoreFindUniqueArgs<ExtArgs>>): Prisma__ConfidenceScoreClient<$Result.GetResult<Prisma.$ConfidenceScorePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ConfidenceScore that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ConfidenceScoreFindUniqueOrThrowArgs} args - Arguments to find a ConfidenceScore
     * @example
     * // Get one ConfidenceScore
     * const confidenceScore = await prisma.confidenceScore.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ConfidenceScoreFindUniqueOrThrowArgs>(args: SelectSubset<T, ConfidenceScoreFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ConfidenceScoreClient<$Result.GetResult<Prisma.$ConfidenceScorePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ConfidenceScore that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfidenceScoreFindFirstArgs} args - Arguments to find a ConfidenceScore
     * @example
     * // Get one ConfidenceScore
     * const confidenceScore = await prisma.confidenceScore.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ConfidenceScoreFindFirstArgs>(args?: SelectSubset<T, ConfidenceScoreFindFirstArgs<ExtArgs>>): Prisma__ConfidenceScoreClient<$Result.GetResult<Prisma.$ConfidenceScorePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ConfidenceScore that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfidenceScoreFindFirstOrThrowArgs} args - Arguments to find a ConfidenceScore
     * @example
     * // Get one ConfidenceScore
     * const confidenceScore = await prisma.confidenceScore.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ConfidenceScoreFindFirstOrThrowArgs>(args?: SelectSubset<T, ConfidenceScoreFindFirstOrThrowArgs<ExtArgs>>): Prisma__ConfidenceScoreClient<$Result.GetResult<Prisma.$ConfidenceScorePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ConfidenceScores that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfidenceScoreFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ConfidenceScores
     * const confidenceScores = await prisma.confidenceScore.findMany()
     * 
     * // Get first 10 ConfidenceScores
     * const confidenceScores = await prisma.confidenceScore.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const confidenceScoreWithIdOnly = await prisma.confidenceScore.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ConfidenceScoreFindManyArgs>(args?: SelectSubset<T, ConfidenceScoreFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConfidenceScorePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ConfidenceScore.
     * @param {ConfidenceScoreCreateArgs} args - Arguments to create a ConfidenceScore.
     * @example
     * // Create one ConfidenceScore
     * const ConfidenceScore = await prisma.confidenceScore.create({
     *   data: {
     *     // ... data to create a ConfidenceScore
     *   }
     * })
     * 
     */
    create<T extends ConfidenceScoreCreateArgs>(args: SelectSubset<T, ConfidenceScoreCreateArgs<ExtArgs>>): Prisma__ConfidenceScoreClient<$Result.GetResult<Prisma.$ConfidenceScorePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ConfidenceScores.
     * @param {ConfidenceScoreCreateManyArgs} args - Arguments to create many ConfidenceScores.
     * @example
     * // Create many ConfidenceScores
     * const confidenceScore = await prisma.confidenceScore.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ConfidenceScoreCreateManyArgs>(args?: SelectSubset<T, ConfidenceScoreCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ConfidenceScores and returns the data saved in the database.
     * @param {ConfidenceScoreCreateManyAndReturnArgs} args - Arguments to create many ConfidenceScores.
     * @example
     * // Create many ConfidenceScores
     * const confidenceScore = await prisma.confidenceScore.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ConfidenceScores and only return the `id`
     * const confidenceScoreWithIdOnly = await prisma.confidenceScore.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ConfidenceScoreCreateManyAndReturnArgs>(args?: SelectSubset<T, ConfidenceScoreCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConfidenceScorePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ConfidenceScore.
     * @param {ConfidenceScoreDeleteArgs} args - Arguments to delete one ConfidenceScore.
     * @example
     * // Delete one ConfidenceScore
     * const ConfidenceScore = await prisma.confidenceScore.delete({
     *   where: {
     *     // ... filter to delete one ConfidenceScore
     *   }
     * })
     * 
     */
    delete<T extends ConfidenceScoreDeleteArgs>(args: SelectSubset<T, ConfidenceScoreDeleteArgs<ExtArgs>>): Prisma__ConfidenceScoreClient<$Result.GetResult<Prisma.$ConfidenceScorePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ConfidenceScore.
     * @param {ConfidenceScoreUpdateArgs} args - Arguments to update one ConfidenceScore.
     * @example
     * // Update one ConfidenceScore
     * const confidenceScore = await prisma.confidenceScore.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ConfidenceScoreUpdateArgs>(args: SelectSubset<T, ConfidenceScoreUpdateArgs<ExtArgs>>): Prisma__ConfidenceScoreClient<$Result.GetResult<Prisma.$ConfidenceScorePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ConfidenceScores.
     * @param {ConfidenceScoreDeleteManyArgs} args - Arguments to filter ConfidenceScores to delete.
     * @example
     * // Delete a few ConfidenceScores
     * const { count } = await prisma.confidenceScore.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ConfidenceScoreDeleteManyArgs>(args?: SelectSubset<T, ConfidenceScoreDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ConfidenceScores.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfidenceScoreUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ConfidenceScores
     * const confidenceScore = await prisma.confidenceScore.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ConfidenceScoreUpdateManyArgs>(args: SelectSubset<T, ConfidenceScoreUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ConfidenceScores and returns the data updated in the database.
     * @param {ConfidenceScoreUpdateManyAndReturnArgs} args - Arguments to update many ConfidenceScores.
     * @example
     * // Update many ConfidenceScores
     * const confidenceScore = await prisma.confidenceScore.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ConfidenceScores and only return the `id`
     * const confidenceScoreWithIdOnly = await prisma.confidenceScore.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ConfidenceScoreUpdateManyAndReturnArgs>(args: SelectSubset<T, ConfidenceScoreUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConfidenceScorePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ConfidenceScore.
     * @param {ConfidenceScoreUpsertArgs} args - Arguments to update or create a ConfidenceScore.
     * @example
     * // Update or create a ConfidenceScore
     * const confidenceScore = await prisma.confidenceScore.upsert({
     *   create: {
     *     // ... data to create a ConfidenceScore
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ConfidenceScore we want to update
     *   }
     * })
     */
    upsert<T extends ConfidenceScoreUpsertArgs>(args: SelectSubset<T, ConfidenceScoreUpsertArgs<ExtArgs>>): Prisma__ConfidenceScoreClient<$Result.GetResult<Prisma.$ConfidenceScorePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ConfidenceScores.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfidenceScoreCountArgs} args - Arguments to filter ConfidenceScores to count.
     * @example
     * // Count the number of ConfidenceScores
     * const count = await prisma.confidenceScore.count({
     *   where: {
     *     // ... the filter for the ConfidenceScores we want to count
     *   }
     * })
    **/
    count<T extends ConfidenceScoreCountArgs>(
      args?: Subset<T, ConfidenceScoreCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ConfidenceScoreCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ConfidenceScore.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfidenceScoreAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ConfidenceScoreAggregateArgs>(args: Subset<T, ConfidenceScoreAggregateArgs>): Prisma.PrismaPromise<GetConfidenceScoreAggregateType<T>>

    /**
     * Group by ConfidenceScore.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfidenceScoreGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ConfidenceScoreGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ConfidenceScoreGroupByArgs['orderBy'] }
        : { orderBy?: ConfidenceScoreGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ConfidenceScoreGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetConfidenceScoreGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ConfidenceScore model
   */
  readonly fields: ConfidenceScoreFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ConfidenceScore.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ConfidenceScoreClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    fixture<T extends FixtureDefaultArgs<ExtArgs> = {}>(args?: Subset<T, FixtureDefaultArgs<ExtArgs>>): Prisma__FixtureClient<$Result.GetResult<Prisma.$FixturePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ConfidenceScore model
   */
  interface ConfidenceScoreFieldRefs {
    readonly id: FieldRef<"ConfidenceScore", 'String'>
    readonly fixtureId: FieldRef<"ConfidenceScore", 'String'>
    readonly pick: FieldRef<"ConfidenceScore", 'String'>
    readonly market: FieldRef<"ConfidenceScore", 'String'>
    readonly formScore: FieldRef<"ConfidenceScore", 'Float'>
    readonly homeAwayScore: FieldRef<"ConfidenceScore", 'Float'>
    readonly h2hScore: FieldRef<"ConfidenceScore", 'Float'>
    readonly goalTrendScore: FieldRef<"ConfidenceScore", 'Float'>
    readonly oddsScore: FieldRef<"ConfidenceScore", 'Float'>
    readonly teamStrengthScore: FieldRef<"ConfidenceScore", 'Float'>
    readonly grooveScore: FieldRef<"ConfidenceScore", 'Float'>
    readonly riskLevel: FieldRef<"ConfidenceScore", 'RiskLevel'>
    readonly confidence: FieldRef<"ConfidenceScore", 'Int'>
    readonly impliedProbability: FieldRef<"ConfidenceScore", 'Float'>
    readonly realProbability: FieldRef<"ConfidenceScore", 'Float'>
    readonly valueEdge: FieldRef<"ConfidenceScore", 'Float'>
    readonly calculatedAt: FieldRef<"ConfidenceScore", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ConfidenceScore findUnique
   */
  export type ConfidenceScoreFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfidenceScore
     */
    select?: ConfidenceScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfidenceScore
     */
    omit?: ConfidenceScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfidenceScoreInclude<ExtArgs> | null
    /**
     * Filter, which ConfidenceScore to fetch.
     */
    where: ConfidenceScoreWhereUniqueInput
  }

  /**
   * ConfidenceScore findUniqueOrThrow
   */
  export type ConfidenceScoreFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfidenceScore
     */
    select?: ConfidenceScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfidenceScore
     */
    omit?: ConfidenceScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfidenceScoreInclude<ExtArgs> | null
    /**
     * Filter, which ConfidenceScore to fetch.
     */
    where: ConfidenceScoreWhereUniqueInput
  }

  /**
   * ConfidenceScore findFirst
   */
  export type ConfidenceScoreFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfidenceScore
     */
    select?: ConfidenceScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfidenceScore
     */
    omit?: ConfidenceScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfidenceScoreInclude<ExtArgs> | null
    /**
     * Filter, which ConfidenceScore to fetch.
     */
    where?: ConfidenceScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConfidenceScores to fetch.
     */
    orderBy?: ConfidenceScoreOrderByWithRelationInput | ConfidenceScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ConfidenceScores.
     */
    cursor?: ConfidenceScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConfidenceScores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConfidenceScores.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ConfidenceScores.
     */
    distinct?: ConfidenceScoreScalarFieldEnum | ConfidenceScoreScalarFieldEnum[]
  }

  /**
   * ConfidenceScore findFirstOrThrow
   */
  export type ConfidenceScoreFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfidenceScore
     */
    select?: ConfidenceScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfidenceScore
     */
    omit?: ConfidenceScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfidenceScoreInclude<ExtArgs> | null
    /**
     * Filter, which ConfidenceScore to fetch.
     */
    where?: ConfidenceScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConfidenceScores to fetch.
     */
    orderBy?: ConfidenceScoreOrderByWithRelationInput | ConfidenceScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ConfidenceScores.
     */
    cursor?: ConfidenceScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConfidenceScores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConfidenceScores.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ConfidenceScores.
     */
    distinct?: ConfidenceScoreScalarFieldEnum | ConfidenceScoreScalarFieldEnum[]
  }

  /**
   * ConfidenceScore findMany
   */
  export type ConfidenceScoreFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfidenceScore
     */
    select?: ConfidenceScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfidenceScore
     */
    omit?: ConfidenceScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfidenceScoreInclude<ExtArgs> | null
    /**
     * Filter, which ConfidenceScores to fetch.
     */
    where?: ConfidenceScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConfidenceScores to fetch.
     */
    orderBy?: ConfidenceScoreOrderByWithRelationInput | ConfidenceScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ConfidenceScores.
     */
    cursor?: ConfidenceScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConfidenceScores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConfidenceScores.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ConfidenceScores.
     */
    distinct?: ConfidenceScoreScalarFieldEnum | ConfidenceScoreScalarFieldEnum[]
  }

  /**
   * ConfidenceScore create
   */
  export type ConfidenceScoreCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfidenceScore
     */
    select?: ConfidenceScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfidenceScore
     */
    omit?: ConfidenceScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfidenceScoreInclude<ExtArgs> | null
    /**
     * The data needed to create a ConfidenceScore.
     */
    data: XOR<ConfidenceScoreCreateInput, ConfidenceScoreUncheckedCreateInput>
  }

  /**
   * ConfidenceScore createMany
   */
  export type ConfidenceScoreCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ConfidenceScores.
     */
    data: ConfidenceScoreCreateManyInput | ConfidenceScoreCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ConfidenceScore createManyAndReturn
   */
  export type ConfidenceScoreCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfidenceScore
     */
    select?: ConfidenceScoreSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ConfidenceScore
     */
    omit?: ConfidenceScoreOmit<ExtArgs> | null
    /**
     * The data used to create many ConfidenceScores.
     */
    data: ConfidenceScoreCreateManyInput | ConfidenceScoreCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfidenceScoreIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ConfidenceScore update
   */
  export type ConfidenceScoreUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfidenceScore
     */
    select?: ConfidenceScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfidenceScore
     */
    omit?: ConfidenceScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfidenceScoreInclude<ExtArgs> | null
    /**
     * The data needed to update a ConfidenceScore.
     */
    data: XOR<ConfidenceScoreUpdateInput, ConfidenceScoreUncheckedUpdateInput>
    /**
     * Choose, which ConfidenceScore to update.
     */
    where: ConfidenceScoreWhereUniqueInput
  }

  /**
   * ConfidenceScore updateMany
   */
  export type ConfidenceScoreUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ConfidenceScores.
     */
    data: XOR<ConfidenceScoreUpdateManyMutationInput, ConfidenceScoreUncheckedUpdateManyInput>
    /**
     * Filter which ConfidenceScores to update
     */
    where?: ConfidenceScoreWhereInput
    /**
     * Limit how many ConfidenceScores to update.
     */
    limit?: number
  }

  /**
   * ConfidenceScore updateManyAndReturn
   */
  export type ConfidenceScoreUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfidenceScore
     */
    select?: ConfidenceScoreSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ConfidenceScore
     */
    omit?: ConfidenceScoreOmit<ExtArgs> | null
    /**
     * The data used to update ConfidenceScores.
     */
    data: XOR<ConfidenceScoreUpdateManyMutationInput, ConfidenceScoreUncheckedUpdateManyInput>
    /**
     * Filter which ConfidenceScores to update
     */
    where?: ConfidenceScoreWhereInput
    /**
     * Limit how many ConfidenceScores to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfidenceScoreIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ConfidenceScore upsert
   */
  export type ConfidenceScoreUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfidenceScore
     */
    select?: ConfidenceScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfidenceScore
     */
    omit?: ConfidenceScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfidenceScoreInclude<ExtArgs> | null
    /**
     * The filter to search for the ConfidenceScore to update in case it exists.
     */
    where: ConfidenceScoreWhereUniqueInput
    /**
     * In case the ConfidenceScore found by the `where` argument doesn't exist, create a new ConfidenceScore with this data.
     */
    create: XOR<ConfidenceScoreCreateInput, ConfidenceScoreUncheckedCreateInput>
    /**
     * In case the ConfidenceScore was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ConfidenceScoreUpdateInput, ConfidenceScoreUncheckedUpdateInput>
  }

  /**
   * ConfidenceScore delete
   */
  export type ConfidenceScoreDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfidenceScore
     */
    select?: ConfidenceScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfidenceScore
     */
    omit?: ConfidenceScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfidenceScoreInclude<ExtArgs> | null
    /**
     * Filter which ConfidenceScore to delete.
     */
    where: ConfidenceScoreWhereUniqueInput
  }

  /**
   * ConfidenceScore deleteMany
   */
  export type ConfidenceScoreDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ConfidenceScores to delete
     */
    where?: ConfidenceScoreWhereInput
    /**
     * Limit how many ConfidenceScores to delete.
     */
    limit?: number
  }

  /**
   * ConfidenceScore without action
   */
  export type ConfidenceScoreDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConfidenceScore
     */
    select?: ConfidenceScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConfidenceScore
     */
    omit?: ConfidenceScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfidenceScoreInclude<ExtArgs> | null
  }


  /**
   * Model MarketRule
   */

  export type AggregateMarketRule = {
    _count: MarketRuleCountAggregateOutputType | null
    _avg: MarketRuleAvgAggregateOutputType | null
    _sum: MarketRuleSumAggregateOutputType | null
    _min: MarketRuleMinAggregateOutputType | null
    _max: MarketRuleMaxAggregateOutputType | null
  }

  export type MarketRuleAvgAggregateOutputType = {
    minConfidence: number | null
    keepThreshold: number | null
    replaceThreshold: number | null
    removeThreshold: number | null
    formWeight: number | null
    homeAwayWeight: number | null
    h2hWeight: number | null
    goalTrendWeight: number | null
    oddsWeight: number | null
    teamStrengthWeight: number | null
  }

  export type MarketRuleSumAggregateOutputType = {
    minConfidence: number | null
    keepThreshold: number | null
    replaceThreshold: number | null
    removeThreshold: number | null
    formWeight: number | null
    homeAwayWeight: number | null
    h2hWeight: number | null
    goalTrendWeight: number | null
    oddsWeight: number | null
    teamStrengthWeight: number | null
  }

  export type MarketRuleMinAggregateOutputType = {
    id: string | null
    marketKey: string | null
    marketName: string | null
    marketGroup: string | null
    riskCategory: $Enums.MarketRisk | null
    minConfidence: number | null
    keepThreshold: number | null
    replaceThreshold: number | null
    removeThreshold: number | null
    formWeight: number | null
    homeAwayWeight: number | null
    h2hWeight: number | null
    goalTrendWeight: number | null
    oddsWeight: number | null
    teamStrengthWeight: number | null
    correlationGroup: string | null
    safeAlternative: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type MarketRuleMaxAggregateOutputType = {
    id: string | null
    marketKey: string | null
    marketName: string | null
    marketGroup: string | null
    riskCategory: $Enums.MarketRisk | null
    minConfidence: number | null
    keepThreshold: number | null
    replaceThreshold: number | null
    removeThreshold: number | null
    formWeight: number | null
    homeAwayWeight: number | null
    h2hWeight: number | null
    goalTrendWeight: number | null
    oddsWeight: number | null
    teamStrengthWeight: number | null
    correlationGroup: string | null
    safeAlternative: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type MarketRuleCountAggregateOutputType = {
    id: number
    marketKey: number
    marketName: number
    marketGroup: number
    riskCategory: number
    minConfidence: number
    keepThreshold: number
    replaceThreshold: number
    removeThreshold: number
    requiredMetrics: number
    formWeight: number
    homeAwayWeight: number
    h2hWeight: number
    goalTrendWeight: number
    oddsWeight: number
    teamStrengthWeight: number
    correlationGroup: number
    safeAlternative: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type MarketRuleAvgAggregateInputType = {
    minConfidence?: true
    keepThreshold?: true
    replaceThreshold?: true
    removeThreshold?: true
    formWeight?: true
    homeAwayWeight?: true
    h2hWeight?: true
    goalTrendWeight?: true
    oddsWeight?: true
    teamStrengthWeight?: true
  }

  export type MarketRuleSumAggregateInputType = {
    minConfidence?: true
    keepThreshold?: true
    replaceThreshold?: true
    removeThreshold?: true
    formWeight?: true
    homeAwayWeight?: true
    h2hWeight?: true
    goalTrendWeight?: true
    oddsWeight?: true
    teamStrengthWeight?: true
  }

  export type MarketRuleMinAggregateInputType = {
    id?: true
    marketKey?: true
    marketName?: true
    marketGroup?: true
    riskCategory?: true
    minConfidence?: true
    keepThreshold?: true
    replaceThreshold?: true
    removeThreshold?: true
    formWeight?: true
    homeAwayWeight?: true
    h2hWeight?: true
    goalTrendWeight?: true
    oddsWeight?: true
    teamStrengthWeight?: true
    correlationGroup?: true
    safeAlternative?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type MarketRuleMaxAggregateInputType = {
    id?: true
    marketKey?: true
    marketName?: true
    marketGroup?: true
    riskCategory?: true
    minConfidence?: true
    keepThreshold?: true
    replaceThreshold?: true
    removeThreshold?: true
    formWeight?: true
    homeAwayWeight?: true
    h2hWeight?: true
    goalTrendWeight?: true
    oddsWeight?: true
    teamStrengthWeight?: true
    correlationGroup?: true
    safeAlternative?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type MarketRuleCountAggregateInputType = {
    id?: true
    marketKey?: true
    marketName?: true
    marketGroup?: true
    riskCategory?: true
    minConfidence?: true
    keepThreshold?: true
    replaceThreshold?: true
    removeThreshold?: true
    requiredMetrics?: true
    formWeight?: true
    homeAwayWeight?: true
    h2hWeight?: true
    goalTrendWeight?: true
    oddsWeight?: true
    teamStrengthWeight?: true
    correlationGroup?: true
    safeAlternative?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type MarketRuleAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MarketRule to aggregate.
     */
    where?: MarketRuleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MarketRules to fetch.
     */
    orderBy?: MarketRuleOrderByWithRelationInput | MarketRuleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MarketRuleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MarketRules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MarketRules.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MarketRules
    **/
    _count?: true | MarketRuleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MarketRuleAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MarketRuleSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MarketRuleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MarketRuleMaxAggregateInputType
  }

  export type GetMarketRuleAggregateType<T extends MarketRuleAggregateArgs> = {
        [P in keyof T & keyof AggregateMarketRule]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMarketRule[P]>
      : GetScalarType<T[P], AggregateMarketRule[P]>
  }




  export type MarketRuleGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MarketRuleWhereInput
    orderBy?: MarketRuleOrderByWithAggregationInput | MarketRuleOrderByWithAggregationInput[]
    by: MarketRuleScalarFieldEnum[] | MarketRuleScalarFieldEnum
    having?: MarketRuleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MarketRuleCountAggregateInputType | true
    _avg?: MarketRuleAvgAggregateInputType
    _sum?: MarketRuleSumAggregateInputType
    _min?: MarketRuleMinAggregateInputType
    _max?: MarketRuleMaxAggregateInputType
  }

  export type MarketRuleGroupByOutputType = {
    id: string
    marketKey: string
    marketName: string
    marketGroup: string
    riskCategory: $Enums.MarketRisk
    minConfidence: number
    keepThreshold: number
    replaceThreshold: number
    removeThreshold: number
    requiredMetrics: JsonValue
    formWeight: number
    homeAwayWeight: number
    h2hWeight: number
    goalTrendWeight: number
    oddsWeight: number
    teamStrengthWeight: number
    correlationGroup: string | null
    safeAlternative: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: MarketRuleCountAggregateOutputType | null
    _avg: MarketRuleAvgAggregateOutputType | null
    _sum: MarketRuleSumAggregateOutputType | null
    _min: MarketRuleMinAggregateOutputType | null
    _max: MarketRuleMaxAggregateOutputType | null
  }

  type GetMarketRuleGroupByPayload<T extends MarketRuleGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MarketRuleGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MarketRuleGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MarketRuleGroupByOutputType[P]>
            : GetScalarType<T[P], MarketRuleGroupByOutputType[P]>
        }
      >
    >


  export type MarketRuleSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    marketKey?: boolean
    marketName?: boolean
    marketGroup?: boolean
    riskCategory?: boolean
    minConfidence?: boolean
    keepThreshold?: boolean
    replaceThreshold?: boolean
    removeThreshold?: boolean
    requiredMetrics?: boolean
    formWeight?: boolean
    homeAwayWeight?: boolean
    h2hWeight?: boolean
    goalTrendWeight?: boolean
    oddsWeight?: boolean
    teamStrengthWeight?: boolean
    correlationGroup?: boolean
    safeAlternative?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["marketRule"]>

  export type MarketRuleSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    marketKey?: boolean
    marketName?: boolean
    marketGroup?: boolean
    riskCategory?: boolean
    minConfidence?: boolean
    keepThreshold?: boolean
    replaceThreshold?: boolean
    removeThreshold?: boolean
    requiredMetrics?: boolean
    formWeight?: boolean
    homeAwayWeight?: boolean
    h2hWeight?: boolean
    goalTrendWeight?: boolean
    oddsWeight?: boolean
    teamStrengthWeight?: boolean
    correlationGroup?: boolean
    safeAlternative?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["marketRule"]>

  export type MarketRuleSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    marketKey?: boolean
    marketName?: boolean
    marketGroup?: boolean
    riskCategory?: boolean
    minConfidence?: boolean
    keepThreshold?: boolean
    replaceThreshold?: boolean
    removeThreshold?: boolean
    requiredMetrics?: boolean
    formWeight?: boolean
    homeAwayWeight?: boolean
    h2hWeight?: boolean
    goalTrendWeight?: boolean
    oddsWeight?: boolean
    teamStrengthWeight?: boolean
    correlationGroup?: boolean
    safeAlternative?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["marketRule"]>

  export type MarketRuleSelectScalar = {
    id?: boolean
    marketKey?: boolean
    marketName?: boolean
    marketGroup?: boolean
    riskCategory?: boolean
    minConfidence?: boolean
    keepThreshold?: boolean
    replaceThreshold?: boolean
    removeThreshold?: boolean
    requiredMetrics?: boolean
    formWeight?: boolean
    homeAwayWeight?: boolean
    h2hWeight?: boolean
    goalTrendWeight?: boolean
    oddsWeight?: boolean
    teamStrengthWeight?: boolean
    correlationGroup?: boolean
    safeAlternative?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type MarketRuleOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "marketKey" | "marketName" | "marketGroup" | "riskCategory" | "minConfidence" | "keepThreshold" | "replaceThreshold" | "removeThreshold" | "requiredMetrics" | "formWeight" | "homeAwayWeight" | "h2hWeight" | "goalTrendWeight" | "oddsWeight" | "teamStrengthWeight" | "correlationGroup" | "safeAlternative" | "isActive" | "createdAt" | "updatedAt", ExtArgs["result"]["marketRule"]>

  export type $MarketRulePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MarketRule"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      marketKey: string
      marketName: string
      marketGroup: string
      riskCategory: $Enums.MarketRisk
      minConfidence: number
      keepThreshold: number
      replaceThreshold: number
      removeThreshold: number
      requiredMetrics: Prisma.JsonValue
      formWeight: number
      homeAwayWeight: number
      h2hWeight: number
      goalTrendWeight: number
      oddsWeight: number
      teamStrengthWeight: number
      correlationGroup: string | null
      safeAlternative: string | null
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["marketRule"]>
    composites: {}
  }

  type MarketRuleGetPayload<S extends boolean | null | undefined | MarketRuleDefaultArgs> = $Result.GetResult<Prisma.$MarketRulePayload, S>

  type MarketRuleCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MarketRuleFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MarketRuleCountAggregateInputType | true
    }

  export interface MarketRuleDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MarketRule'], meta: { name: 'MarketRule' } }
    /**
     * Find zero or one MarketRule that matches the filter.
     * @param {MarketRuleFindUniqueArgs} args - Arguments to find a MarketRule
     * @example
     * // Get one MarketRule
     * const marketRule = await prisma.marketRule.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MarketRuleFindUniqueArgs>(args: SelectSubset<T, MarketRuleFindUniqueArgs<ExtArgs>>): Prisma__MarketRuleClient<$Result.GetResult<Prisma.$MarketRulePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one MarketRule that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MarketRuleFindUniqueOrThrowArgs} args - Arguments to find a MarketRule
     * @example
     * // Get one MarketRule
     * const marketRule = await prisma.marketRule.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MarketRuleFindUniqueOrThrowArgs>(args: SelectSubset<T, MarketRuleFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MarketRuleClient<$Result.GetResult<Prisma.$MarketRulePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MarketRule that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketRuleFindFirstArgs} args - Arguments to find a MarketRule
     * @example
     * // Get one MarketRule
     * const marketRule = await prisma.marketRule.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MarketRuleFindFirstArgs>(args?: SelectSubset<T, MarketRuleFindFirstArgs<ExtArgs>>): Prisma__MarketRuleClient<$Result.GetResult<Prisma.$MarketRulePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MarketRule that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketRuleFindFirstOrThrowArgs} args - Arguments to find a MarketRule
     * @example
     * // Get one MarketRule
     * const marketRule = await prisma.marketRule.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MarketRuleFindFirstOrThrowArgs>(args?: SelectSubset<T, MarketRuleFindFirstOrThrowArgs<ExtArgs>>): Prisma__MarketRuleClient<$Result.GetResult<Prisma.$MarketRulePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more MarketRules that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketRuleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MarketRules
     * const marketRules = await prisma.marketRule.findMany()
     * 
     * // Get first 10 MarketRules
     * const marketRules = await prisma.marketRule.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const marketRuleWithIdOnly = await prisma.marketRule.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MarketRuleFindManyArgs>(args?: SelectSubset<T, MarketRuleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MarketRulePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a MarketRule.
     * @param {MarketRuleCreateArgs} args - Arguments to create a MarketRule.
     * @example
     * // Create one MarketRule
     * const MarketRule = await prisma.marketRule.create({
     *   data: {
     *     // ... data to create a MarketRule
     *   }
     * })
     * 
     */
    create<T extends MarketRuleCreateArgs>(args: SelectSubset<T, MarketRuleCreateArgs<ExtArgs>>): Prisma__MarketRuleClient<$Result.GetResult<Prisma.$MarketRulePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many MarketRules.
     * @param {MarketRuleCreateManyArgs} args - Arguments to create many MarketRules.
     * @example
     * // Create many MarketRules
     * const marketRule = await prisma.marketRule.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MarketRuleCreateManyArgs>(args?: SelectSubset<T, MarketRuleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many MarketRules and returns the data saved in the database.
     * @param {MarketRuleCreateManyAndReturnArgs} args - Arguments to create many MarketRules.
     * @example
     * // Create many MarketRules
     * const marketRule = await prisma.marketRule.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many MarketRules and only return the `id`
     * const marketRuleWithIdOnly = await prisma.marketRule.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MarketRuleCreateManyAndReturnArgs>(args?: SelectSubset<T, MarketRuleCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MarketRulePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a MarketRule.
     * @param {MarketRuleDeleteArgs} args - Arguments to delete one MarketRule.
     * @example
     * // Delete one MarketRule
     * const MarketRule = await prisma.marketRule.delete({
     *   where: {
     *     // ... filter to delete one MarketRule
     *   }
     * })
     * 
     */
    delete<T extends MarketRuleDeleteArgs>(args: SelectSubset<T, MarketRuleDeleteArgs<ExtArgs>>): Prisma__MarketRuleClient<$Result.GetResult<Prisma.$MarketRulePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one MarketRule.
     * @param {MarketRuleUpdateArgs} args - Arguments to update one MarketRule.
     * @example
     * // Update one MarketRule
     * const marketRule = await prisma.marketRule.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MarketRuleUpdateArgs>(args: SelectSubset<T, MarketRuleUpdateArgs<ExtArgs>>): Prisma__MarketRuleClient<$Result.GetResult<Prisma.$MarketRulePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more MarketRules.
     * @param {MarketRuleDeleteManyArgs} args - Arguments to filter MarketRules to delete.
     * @example
     * // Delete a few MarketRules
     * const { count } = await prisma.marketRule.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MarketRuleDeleteManyArgs>(args?: SelectSubset<T, MarketRuleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MarketRules.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketRuleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MarketRules
     * const marketRule = await prisma.marketRule.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MarketRuleUpdateManyArgs>(args: SelectSubset<T, MarketRuleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MarketRules and returns the data updated in the database.
     * @param {MarketRuleUpdateManyAndReturnArgs} args - Arguments to update many MarketRules.
     * @example
     * // Update many MarketRules
     * const marketRule = await prisma.marketRule.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more MarketRules and only return the `id`
     * const marketRuleWithIdOnly = await prisma.marketRule.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MarketRuleUpdateManyAndReturnArgs>(args: SelectSubset<T, MarketRuleUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MarketRulePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one MarketRule.
     * @param {MarketRuleUpsertArgs} args - Arguments to update or create a MarketRule.
     * @example
     * // Update or create a MarketRule
     * const marketRule = await prisma.marketRule.upsert({
     *   create: {
     *     // ... data to create a MarketRule
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MarketRule we want to update
     *   }
     * })
     */
    upsert<T extends MarketRuleUpsertArgs>(args: SelectSubset<T, MarketRuleUpsertArgs<ExtArgs>>): Prisma__MarketRuleClient<$Result.GetResult<Prisma.$MarketRulePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of MarketRules.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketRuleCountArgs} args - Arguments to filter MarketRules to count.
     * @example
     * // Count the number of MarketRules
     * const count = await prisma.marketRule.count({
     *   where: {
     *     // ... the filter for the MarketRules we want to count
     *   }
     * })
    **/
    count<T extends MarketRuleCountArgs>(
      args?: Subset<T, MarketRuleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MarketRuleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MarketRule.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketRuleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MarketRuleAggregateArgs>(args: Subset<T, MarketRuleAggregateArgs>): Prisma.PrismaPromise<GetMarketRuleAggregateType<T>>

    /**
     * Group by MarketRule.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketRuleGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MarketRuleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MarketRuleGroupByArgs['orderBy'] }
        : { orderBy?: MarketRuleGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MarketRuleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMarketRuleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MarketRule model
   */
  readonly fields: MarketRuleFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MarketRule.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MarketRuleClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the MarketRule model
   */
  interface MarketRuleFieldRefs {
    readonly id: FieldRef<"MarketRule", 'String'>
    readonly marketKey: FieldRef<"MarketRule", 'String'>
    readonly marketName: FieldRef<"MarketRule", 'String'>
    readonly marketGroup: FieldRef<"MarketRule", 'String'>
    readonly riskCategory: FieldRef<"MarketRule", 'MarketRisk'>
    readonly minConfidence: FieldRef<"MarketRule", 'Int'>
    readonly keepThreshold: FieldRef<"MarketRule", 'Int'>
    readonly replaceThreshold: FieldRef<"MarketRule", 'Int'>
    readonly removeThreshold: FieldRef<"MarketRule", 'Int'>
    readonly requiredMetrics: FieldRef<"MarketRule", 'Json'>
    readonly formWeight: FieldRef<"MarketRule", 'Float'>
    readonly homeAwayWeight: FieldRef<"MarketRule", 'Float'>
    readonly h2hWeight: FieldRef<"MarketRule", 'Float'>
    readonly goalTrendWeight: FieldRef<"MarketRule", 'Float'>
    readonly oddsWeight: FieldRef<"MarketRule", 'Float'>
    readonly teamStrengthWeight: FieldRef<"MarketRule", 'Float'>
    readonly correlationGroup: FieldRef<"MarketRule", 'String'>
    readonly safeAlternative: FieldRef<"MarketRule", 'String'>
    readonly isActive: FieldRef<"MarketRule", 'Boolean'>
    readonly createdAt: FieldRef<"MarketRule", 'DateTime'>
    readonly updatedAt: FieldRef<"MarketRule", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * MarketRule findUnique
   */
  export type MarketRuleFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketRule
     */
    select?: MarketRuleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarketRule
     */
    omit?: MarketRuleOmit<ExtArgs> | null
    /**
     * Filter, which MarketRule to fetch.
     */
    where: MarketRuleWhereUniqueInput
  }

  /**
   * MarketRule findUniqueOrThrow
   */
  export type MarketRuleFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketRule
     */
    select?: MarketRuleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarketRule
     */
    omit?: MarketRuleOmit<ExtArgs> | null
    /**
     * Filter, which MarketRule to fetch.
     */
    where: MarketRuleWhereUniqueInput
  }

  /**
   * MarketRule findFirst
   */
  export type MarketRuleFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketRule
     */
    select?: MarketRuleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarketRule
     */
    omit?: MarketRuleOmit<ExtArgs> | null
    /**
     * Filter, which MarketRule to fetch.
     */
    where?: MarketRuleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MarketRules to fetch.
     */
    orderBy?: MarketRuleOrderByWithRelationInput | MarketRuleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MarketRules.
     */
    cursor?: MarketRuleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MarketRules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MarketRules.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MarketRules.
     */
    distinct?: MarketRuleScalarFieldEnum | MarketRuleScalarFieldEnum[]
  }

  /**
   * MarketRule findFirstOrThrow
   */
  export type MarketRuleFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketRule
     */
    select?: MarketRuleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarketRule
     */
    omit?: MarketRuleOmit<ExtArgs> | null
    /**
     * Filter, which MarketRule to fetch.
     */
    where?: MarketRuleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MarketRules to fetch.
     */
    orderBy?: MarketRuleOrderByWithRelationInput | MarketRuleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MarketRules.
     */
    cursor?: MarketRuleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MarketRules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MarketRules.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MarketRules.
     */
    distinct?: MarketRuleScalarFieldEnum | MarketRuleScalarFieldEnum[]
  }

  /**
   * MarketRule findMany
   */
  export type MarketRuleFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketRule
     */
    select?: MarketRuleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarketRule
     */
    omit?: MarketRuleOmit<ExtArgs> | null
    /**
     * Filter, which MarketRules to fetch.
     */
    where?: MarketRuleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MarketRules to fetch.
     */
    orderBy?: MarketRuleOrderByWithRelationInput | MarketRuleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MarketRules.
     */
    cursor?: MarketRuleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MarketRules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MarketRules.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MarketRules.
     */
    distinct?: MarketRuleScalarFieldEnum | MarketRuleScalarFieldEnum[]
  }

  /**
   * MarketRule create
   */
  export type MarketRuleCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketRule
     */
    select?: MarketRuleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarketRule
     */
    omit?: MarketRuleOmit<ExtArgs> | null
    /**
     * The data needed to create a MarketRule.
     */
    data: XOR<MarketRuleCreateInput, MarketRuleUncheckedCreateInput>
  }

  /**
   * MarketRule createMany
   */
  export type MarketRuleCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MarketRules.
     */
    data: MarketRuleCreateManyInput | MarketRuleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MarketRule createManyAndReturn
   */
  export type MarketRuleCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketRule
     */
    select?: MarketRuleSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MarketRule
     */
    omit?: MarketRuleOmit<ExtArgs> | null
    /**
     * The data used to create many MarketRules.
     */
    data: MarketRuleCreateManyInput | MarketRuleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MarketRule update
   */
  export type MarketRuleUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketRule
     */
    select?: MarketRuleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarketRule
     */
    omit?: MarketRuleOmit<ExtArgs> | null
    /**
     * The data needed to update a MarketRule.
     */
    data: XOR<MarketRuleUpdateInput, MarketRuleUncheckedUpdateInput>
    /**
     * Choose, which MarketRule to update.
     */
    where: MarketRuleWhereUniqueInput
  }

  /**
   * MarketRule updateMany
   */
  export type MarketRuleUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MarketRules.
     */
    data: XOR<MarketRuleUpdateManyMutationInput, MarketRuleUncheckedUpdateManyInput>
    /**
     * Filter which MarketRules to update
     */
    where?: MarketRuleWhereInput
    /**
     * Limit how many MarketRules to update.
     */
    limit?: number
  }

  /**
   * MarketRule updateManyAndReturn
   */
  export type MarketRuleUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketRule
     */
    select?: MarketRuleSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MarketRule
     */
    omit?: MarketRuleOmit<ExtArgs> | null
    /**
     * The data used to update MarketRules.
     */
    data: XOR<MarketRuleUpdateManyMutationInput, MarketRuleUncheckedUpdateManyInput>
    /**
     * Filter which MarketRules to update
     */
    where?: MarketRuleWhereInput
    /**
     * Limit how many MarketRules to update.
     */
    limit?: number
  }

  /**
   * MarketRule upsert
   */
  export type MarketRuleUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketRule
     */
    select?: MarketRuleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarketRule
     */
    omit?: MarketRuleOmit<ExtArgs> | null
    /**
     * The filter to search for the MarketRule to update in case it exists.
     */
    where: MarketRuleWhereUniqueInput
    /**
     * In case the MarketRule found by the `where` argument doesn't exist, create a new MarketRule with this data.
     */
    create: XOR<MarketRuleCreateInput, MarketRuleUncheckedCreateInput>
    /**
     * In case the MarketRule was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MarketRuleUpdateInput, MarketRuleUncheckedUpdateInput>
  }

  /**
   * MarketRule delete
   */
  export type MarketRuleDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketRule
     */
    select?: MarketRuleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarketRule
     */
    omit?: MarketRuleOmit<ExtArgs> | null
    /**
     * Filter which MarketRule to delete.
     */
    where: MarketRuleWhereUniqueInput
  }

  /**
   * MarketRule deleteMany
   */
  export type MarketRuleDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MarketRules to delete
     */
    where?: MarketRuleWhereInput
    /**
     * Limit how many MarketRules to delete.
     */
    limit?: number
  }

  /**
   * MarketRule without action
   */
  export type MarketRuleDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketRule
     */
    select?: MarketRuleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarketRule
     */
    omit?: MarketRuleOmit<ExtArgs> | null
  }


  /**
   * Model ValueBetScan
   */

  export type AggregateValueBetScan = {
    _count: ValueBetScanCountAggregateOutputType | null
    _avg: ValueBetScanAvgAggregateOutputType | null
    _sum: ValueBetScanSumAggregateOutputType | null
    _min: ValueBetScanMinAggregateOutputType | null
    _max: ValueBetScanMaxAggregateOutputType | null
  }

  export type ValueBetScanAvgAggregateOutputType = {
    odds: number | null
    grooveScore: number | null
    realProbability: number | null
    impliedProbability: number | null
    valueEdge: number | null
    confidence: number | null
  }

  export type ValueBetScanSumAggregateOutputType = {
    odds: number | null
    grooveScore: number | null
    realProbability: number | null
    impliedProbability: number | null
    valueEdge: number | null
    confidence: number | null
  }

  export type ValueBetScanMinAggregateOutputType = {
    id: string | null
    fixtureId: string | null
    pick: string | null
    market: string | null
    odds: number | null
    grooveScore: number | null
    realProbability: number | null
    impliedProbability: number | null
    valueEdge: number | null
    confidence: number | null
    reason: string | null
    scanDate: Date | null
    isActive: boolean | null
  }

  export type ValueBetScanMaxAggregateOutputType = {
    id: string | null
    fixtureId: string | null
    pick: string | null
    market: string | null
    odds: number | null
    grooveScore: number | null
    realProbability: number | null
    impliedProbability: number | null
    valueEdge: number | null
    confidence: number | null
    reason: string | null
    scanDate: Date | null
    isActive: boolean | null
  }

  export type ValueBetScanCountAggregateOutputType = {
    id: number
    fixtureId: number
    pick: number
    market: number
    odds: number
    grooveScore: number
    realProbability: number
    impliedProbability: number
    valueEdge: number
    confidence: number
    reason: number
    scanDate: number
    isActive: number
    _all: number
  }


  export type ValueBetScanAvgAggregateInputType = {
    odds?: true
    grooveScore?: true
    realProbability?: true
    impliedProbability?: true
    valueEdge?: true
    confidence?: true
  }

  export type ValueBetScanSumAggregateInputType = {
    odds?: true
    grooveScore?: true
    realProbability?: true
    impliedProbability?: true
    valueEdge?: true
    confidence?: true
  }

  export type ValueBetScanMinAggregateInputType = {
    id?: true
    fixtureId?: true
    pick?: true
    market?: true
    odds?: true
    grooveScore?: true
    realProbability?: true
    impliedProbability?: true
    valueEdge?: true
    confidence?: true
    reason?: true
    scanDate?: true
    isActive?: true
  }

  export type ValueBetScanMaxAggregateInputType = {
    id?: true
    fixtureId?: true
    pick?: true
    market?: true
    odds?: true
    grooveScore?: true
    realProbability?: true
    impliedProbability?: true
    valueEdge?: true
    confidence?: true
    reason?: true
    scanDate?: true
    isActive?: true
  }

  export type ValueBetScanCountAggregateInputType = {
    id?: true
    fixtureId?: true
    pick?: true
    market?: true
    odds?: true
    grooveScore?: true
    realProbability?: true
    impliedProbability?: true
    valueEdge?: true
    confidence?: true
    reason?: true
    scanDate?: true
    isActive?: true
    _all?: true
  }

  export type ValueBetScanAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ValueBetScan to aggregate.
     */
    where?: ValueBetScanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ValueBetScans to fetch.
     */
    orderBy?: ValueBetScanOrderByWithRelationInput | ValueBetScanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ValueBetScanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ValueBetScans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ValueBetScans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ValueBetScans
    **/
    _count?: true | ValueBetScanCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ValueBetScanAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ValueBetScanSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ValueBetScanMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ValueBetScanMaxAggregateInputType
  }

  export type GetValueBetScanAggregateType<T extends ValueBetScanAggregateArgs> = {
        [P in keyof T & keyof AggregateValueBetScan]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateValueBetScan[P]>
      : GetScalarType<T[P], AggregateValueBetScan[P]>
  }




  export type ValueBetScanGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ValueBetScanWhereInput
    orderBy?: ValueBetScanOrderByWithAggregationInput | ValueBetScanOrderByWithAggregationInput[]
    by: ValueBetScanScalarFieldEnum[] | ValueBetScanScalarFieldEnum
    having?: ValueBetScanScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ValueBetScanCountAggregateInputType | true
    _avg?: ValueBetScanAvgAggregateInputType
    _sum?: ValueBetScanSumAggregateInputType
    _min?: ValueBetScanMinAggregateInputType
    _max?: ValueBetScanMaxAggregateInputType
  }

  export type ValueBetScanGroupByOutputType = {
    id: string
    fixtureId: string
    pick: string
    market: string
    odds: number
    grooveScore: number
    realProbability: number
    impliedProbability: number
    valueEdge: number
    confidence: number
    reason: string
    scanDate: Date
    isActive: boolean
    _count: ValueBetScanCountAggregateOutputType | null
    _avg: ValueBetScanAvgAggregateOutputType | null
    _sum: ValueBetScanSumAggregateOutputType | null
    _min: ValueBetScanMinAggregateOutputType | null
    _max: ValueBetScanMaxAggregateOutputType | null
  }

  type GetValueBetScanGroupByPayload<T extends ValueBetScanGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ValueBetScanGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ValueBetScanGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ValueBetScanGroupByOutputType[P]>
            : GetScalarType<T[P], ValueBetScanGroupByOutputType[P]>
        }
      >
    >


  export type ValueBetScanSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fixtureId?: boolean
    pick?: boolean
    market?: boolean
    odds?: boolean
    grooveScore?: boolean
    realProbability?: boolean
    impliedProbability?: boolean
    valueEdge?: boolean
    confidence?: boolean
    reason?: boolean
    scanDate?: boolean
    isActive?: boolean
    fixture?: boolean | FixtureDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["valueBetScan"]>

  export type ValueBetScanSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fixtureId?: boolean
    pick?: boolean
    market?: boolean
    odds?: boolean
    grooveScore?: boolean
    realProbability?: boolean
    impliedProbability?: boolean
    valueEdge?: boolean
    confidence?: boolean
    reason?: boolean
    scanDate?: boolean
    isActive?: boolean
    fixture?: boolean | FixtureDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["valueBetScan"]>

  export type ValueBetScanSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fixtureId?: boolean
    pick?: boolean
    market?: boolean
    odds?: boolean
    grooveScore?: boolean
    realProbability?: boolean
    impliedProbability?: boolean
    valueEdge?: boolean
    confidence?: boolean
    reason?: boolean
    scanDate?: boolean
    isActive?: boolean
    fixture?: boolean | FixtureDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["valueBetScan"]>

  export type ValueBetScanSelectScalar = {
    id?: boolean
    fixtureId?: boolean
    pick?: boolean
    market?: boolean
    odds?: boolean
    grooveScore?: boolean
    realProbability?: boolean
    impliedProbability?: boolean
    valueEdge?: boolean
    confidence?: boolean
    reason?: boolean
    scanDate?: boolean
    isActive?: boolean
  }

  export type ValueBetScanOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "fixtureId" | "pick" | "market" | "odds" | "grooveScore" | "realProbability" | "impliedProbability" | "valueEdge" | "confidence" | "reason" | "scanDate" | "isActive", ExtArgs["result"]["valueBetScan"]>
  export type ValueBetScanInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    fixture?: boolean | FixtureDefaultArgs<ExtArgs>
  }
  export type ValueBetScanIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    fixture?: boolean | FixtureDefaultArgs<ExtArgs>
  }
  export type ValueBetScanIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    fixture?: boolean | FixtureDefaultArgs<ExtArgs>
  }

  export type $ValueBetScanPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ValueBetScan"
    objects: {
      fixture: Prisma.$FixturePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      fixtureId: string
      pick: string
      market: string
      odds: number
      grooveScore: number
      realProbability: number
      impliedProbability: number
      valueEdge: number
      confidence: number
      reason: string
      scanDate: Date
      isActive: boolean
    }, ExtArgs["result"]["valueBetScan"]>
    composites: {}
  }

  type ValueBetScanGetPayload<S extends boolean | null | undefined | ValueBetScanDefaultArgs> = $Result.GetResult<Prisma.$ValueBetScanPayload, S>

  type ValueBetScanCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ValueBetScanFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ValueBetScanCountAggregateInputType | true
    }

  export interface ValueBetScanDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ValueBetScan'], meta: { name: 'ValueBetScan' } }
    /**
     * Find zero or one ValueBetScan that matches the filter.
     * @param {ValueBetScanFindUniqueArgs} args - Arguments to find a ValueBetScan
     * @example
     * // Get one ValueBetScan
     * const valueBetScan = await prisma.valueBetScan.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ValueBetScanFindUniqueArgs>(args: SelectSubset<T, ValueBetScanFindUniqueArgs<ExtArgs>>): Prisma__ValueBetScanClient<$Result.GetResult<Prisma.$ValueBetScanPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ValueBetScan that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ValueBetScanFindUniqueOrThrowArgs} args - Arguments to find a ValueBetScan
     * @example
     * // Get one ValueBetScan
     * const valueBetScan = await prisma.valueBetScan.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ValueBetScanFindUniqueOrThrowArgs>(args: SelectSubset<T, ValueBetScanFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ValueBetScanClient<$Result.GetResult<Prisma.$ValueBetScanPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ValueBetScan that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ValueBetScanFindFirstArgs} args - Arguments to find a ValueBetScan
     * @example
     * // Get one ValueBetScan
     * const valueBetScan = await prisma.valueBetScan.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ValueBetScanFindFirstArgs>(args?: SelectSubset<T, ValueBetScanFindFirstArgs<ExtArgs>>): Prisma__ValueBetScanClient<$Result.GetResult<Prisma.$ValueBetScanPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ValueBetScan that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ValueBetScanFindFirstOrThrowArgs} args - Arguments to find a ValueBetScan
     * @example
     * // Get one ValueBetScan
     * const valueBetScan = await prisma.valueBetScan.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ValueBetScanFindFirstOrThrowArgs>(args?: SelectSubset<T, ValueBetScanFindFirstOrThrowArgs<ExtArgs>>): Prisma__ValueBetScanClient<$Result.GetResult<Prisma.$ValueBetScanPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ValueBetScans that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ValueBetScanFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ValueBetScans
     * const valueBetScans = await prisma.valueBetScan.findMany()
     * 
     * // Get first 10 ValueBetScans
     * const valueBetScans = await prisma.valueBetScan.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const valueBetScanWithIdOnly = await prisma.valueBetScan.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ValueBetScanFindManyArgs>(args?: SelectSubset<T, ValueBetScanFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ValueBetScanPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ValueBetScan.
     * @param {ValueBetScanCreateArgs} args - Arguments to create a ValueBetScan.
     * @example
     * // Create one ValueBetScan
     * const ValueBetScan = await prisma.valueBetScan.create({
     *   data: {
     *     // ... data to create a ValueBetScan
     *   }
     * })
     * 
     */
    create<T extends ValueBetScanCreateArgs>(args: SelectSubset<T, ValueBetScanCreateArgs<ExtArgs>>): Prisma__ValueBetScanClient<$Result.GetResult<Prisma.$ValueBetScanPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ValueBetScans.
     * @param {ValueBetScanCreateManyArgs} args - Arguments to create many ValueBetScans.
     * @example
     * // Create many ValueBetScans
     * const valueBetScan = await prisma.valueBetScan.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ValueBetScanCreateManyArgs>(args?: SelectSubset<T, ValueBetScanCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ValueBetScans and returns the data saved in the database.
     * @param {ValueBetScanCreateManyAndReturnArgs} args - Arguments to create many ValueBetScans.
     * @example
     * // Create many ValueBetScans
     * const valueBetScan = await prisma.valueBetScan.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ValueBetScans and only return the `id`
     * const valueBetScanWithIdOnly = await prisma.valueBetScan.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ValueBetScanCreateManyAndReturnArgs>(args?: SelectSubset<T, ValueBetScanCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ValueBetScanPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ValueBetScan.
     * @param {ValueBetScanDeleteArgs} args - Arguments to delete one ValueBetScan.
     * @example
     * // Delete one ValueBetScan
     * const ValueBetScan = await prisma.valueBetScan.delete({
     *   where: {
     *     // ... filter to delete one ValueBetScan
     *   }
     * })
     * 
     */
    delete<T extends ValueBetScanDeleteArgs>(args: SelectSubset<T, ValueBetScanDeleteArgs<ExtArgs>>): Prisma__ValueBetScanClient<$Result.GetResult<Prisma.$ValueBetScanPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ValueBetScan.
     * @param {ValueBetScanUpdateArgs} args - Arguments to update one ValueBetScan.
     * @example
     * // Update one ValueBetScan
     * const valueBetScan = await prisma.valueBetScan.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ValueBetScanUpdateArgs>(args: SelectSubset<T, ValueBetScanUpdateArgs<ExtArgs>>): Prisma__ValueBetScanClient<$Result.GetResult<Prisma.$ValueBetScanPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ValueBetScans.
     * @param {ValueBetScanDeleteManyArgs} args - Arguments to filter ValueBetScans to delete.
     * @example
     * // Delete a few ValueBetScans
     * const { count } = await prisma.valueBetScan.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ValueBetScanDeleteManyArgs>(args?: SelectSubset<T, ValueBetScanDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ValueBetScans.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ValueBetScanUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ValueBetScans
     * const valueBetScan = await prisma.valueBetScan.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ValueBetScanUpdateManyArgs>(args: SelectSubset<T, ValueBetScanUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ValueBetScans and returns the data updated in the database.
     * @param {ValueBetScanUpdateManyAndReturnArgs} args - Arguments to update many ValueBetScans.
     * @example
     * // Update many ValueBetScans
     * const valueBetScan = await prisma.valueBetScan.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ValueBetScans and only return the `id`
     * const valueBetScanWithIdOnly = await prisma.valueBetScan.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ValueBetScanUpdateManyAndReturnArgs>(args: SelectSubset<T, ValueBetScanUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ValueBetScanPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ValueBetScan.
     * @param {ValueBetScanUpsertArgs} args - Arguments to update or create a ValueBetScan.
     * @example
     * // Update or create a ValueBetScan
     * const valueBetScan = await prisma.valueBetScan.upsert({
     *   create: {
     *     // ... data to create a ValueBetScan
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ValueBetScan we want to update
     *   }
     * })
     */
    upsert<T extends ValueBetScanUpsertArgs>(args: SelectSubset<T, ValueBetScanUpsertArgs<ExtArgs>>): Prisma__ValueBetScanClient<$Result.GetResult<Prisma.$ValueBetScanPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ValueBetScans.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ValueBetScanCountArgs} args - Arguments to filter ValueBetScans to count.
     * @example
     * // Count the number of ValueBetScans
     * const count = await prisma.valueBetScan.count({
     *   where: {
     *     // ... the filter for the ValueBetScans we want to count
     *   }
     * })
    **/
    count<T extends ValueBetScanCountArgs>(
      args?: Subset<T, ValueBetScanCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ValueBetScanCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ValueBetScan.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ValueBetScanAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ValueBetScanAggregateArgs>(args: Subset<T, ValueBetScanAggregateArgs>): Prisma.PrismaPromise<GetValueBetScanAggregateType<T>>

    /**
     * Group by ValueBetScan.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ValueBetScanGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ValueBetScanGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ValueBetScanGroupByArgs['orderBy'] }
        : { orderBy?: ValueBetScanGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ValueBetScanGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetValueBetScanGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ValueBetScan model
   */
  readonly fields: ValueBetScanFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ValueBetScan.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ValueBetScanClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    fixture<T extends FixtureDefaultArgs<ExtArgs> = {}>(args?: Subset<T, FixtureDefaultArgs<ExtArgs>>): Prisma__FixtureClient<$Result.GetResult<Prisma.$FixturePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ValueBetScan model
   */
  interface ValueBetScanFieldRefs {
    readonly id: FieldRef<"ValueBetScan", 'String'>
    readonly fixtureId: FieldRef<"ValueBetScan", 'String'>
    readonly pick: FieldRef<"ValueBetScan", 'String'>
    readonly market: FieldRef<"ValueBetScan", 'String'>
    readonly odds: FieldRef<"ValueBetScan", 'Float'>
    readonly grooveScore: FieldRef<"ValueBetScan", 'Float'>
    readonly realProbability: FieldRef<"ValueBetScan", 'Float'>
    readonly impliedProbability: FieldRef<"ValueBetScan", 'Float'>
    readonly valueEdge: FieldRef<"ValueBetScan", 'Float'>
    readonly confidence: FieldRef<"ValueBetScan", 'Int'>
    readonly reason: FieldRef<"ValueBetScan", 'String'>
    readonly scanDate: FieldRef<"ValueBetScan", 'DateTime'>
    readonly isActive: FieldRef<"ValueBetScan", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * ValueBetScan findUnique
   */
  export type ValueBetScanFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ValueBetScan
     */
    select?: ValueBetScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ValueBetScan
     */
    omit?: ValueBetScanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ValueBetScanInclude<ExtArgs> | null
    /**
     * Filter, which ValueBetScan to fetch.
     */
    where: ValueBetScanWhereUniqueInput
  }

  /**
   * ValueBetScan findUniqueOrThrow
   */
  export type ValueBetScanFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ValueBetScan
     */
    select?: ValueBetScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ValueBetScan
     */
    omit?: ValueBetScanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ValueBetScanInclude<ExtArgs> | null
    /**
     * Filter, which ValueBetScan to fetch.
     */
    where: ValueBetScanWhereUniqueInput
  }

  /**
   * ValueBetScan findFirst
   */
  export type ValueBetScanFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ValueBetScan
     */
    select?: ValueBetScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ValueBetScan
     */
    omit?: ValueBetScanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ValueBetScanInclude<ExtArgs> | null
    /**
     * Filter, which ValueBetScan to fetch.
     */
    where?: ValueBetScanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ValueBetScans to fetch.
     */
    orderBy?: ValueBetScanOrderByWithRelationInput | ValueBetScanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ValueBetScans.
     */
    cursor?: ValueBetScanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ValueBetScans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ValueBetScans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ValueBetScans.
     */
    distinct?: ValueBetScanScalarFieldEnum | ValueBetScanScalarFieldEnum[]
  }

  /**
   * ValueBetScan findFirstOrThrow
   */
  export type ValueBetScanFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ValueBetScan
     */
    select?: ValueBetScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ValueBetScan
     */
    omit?: ValueBetScanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ValueBetScanInclude<ExtArgs> | null
    /**
     * Filter, which ValueBetScan to fetch.
     */
    where?: ValueBetScanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ValueBetScans to fetch.
     */
    orderBy?: ValueBetScanOrderByWithRelationInput | ValueBetScanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ValueBetScans.
     */
    cursor?: ValueBetScanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ValueBetScans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ValueBetScans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ValueBetScans.
     */
    distinct?: ValueBetScanScalarFieldEnum | ValueBetScanScalarFieldEnum[]
  }

  /**
   * ValueBetScan findMany
   */
  export type ValueBetScanFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ValueBetScan
     */
    select?: ValueBetScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ValueBetScan
     */
    omit?: ValueBetScanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ValueBetScanInclude<ExtArgs> | null
    /**
     * Filter, which ValueBetScans to fetch.
     */
    where?: ValueBetScanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ValueBetScans to fetch.
     */
    orderBy?: ValueBetScanOrderByWithRelationInput | ValueBetScanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ValueBetScans.
     */
    cursor?: ValueBetScanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ValueBetScans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ValueBetScans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ValueBetScans.
     */
    distinct?: ValueBetScanScalarFieldEnum | ValueBetScanScalarFieldEnum[]
  }

  /**
   * ValueBetScan create
   */
  export type ValueBetScanCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ValueBetScan
     */
    select?: ValueBetScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ValueBetScan
     */
    omit?: ValueBetScanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ValueBetScanInclude<ExtArgs> | null
    /**
     * The data needed to create a ValueBetScan.
     */
    data: XOR<ValueBetScanCreateInput, ValueBetScanUncheckedCreateInput>
  }

  /**
   * ValueBetScan createMany
   */
  export type ValueBetScanCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ValueBetScans.
     */
    data: ValueBetScanCreateManyInput | ValueBetScanCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ValueBetScan createManyAndReturn
   */
  export type ValueBetScanCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ValueBetScan
     */
    select?: ValueBetScanSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ValueBetScan
     */
    omit?: ValueBetScanOmit<ExtArgs> | null
    /**
     * The data used to create many ValueBetScans.
     */
    data: ValueBetScanCreateManyInput | ValueBetScanCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ValueBetScanIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ValueBetScan update
   */
  export type ValueBetScanUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ValueBetScan
     */
    select?: ValueBetScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ValueBetScan
     */
    omit?: ValueBetScanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ValueBetScanInclude<ExtArgs> | null
    /**
     * The data needed to update a ValueBetScan.
     */
    data: XOR<ValueBetScanUpdateInput, ValueBetScanUncheckedUpdateInput>
    /**
     * Choose, which ValueBetScan to update.
     */
    where: ValueBetScanWhereUniqueInput
  }

  /**
   * ValueBetScan updateMany
   */
  export type ValueBetScanUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ValueBetScans.
     */
    data: XOR<ValueBetScanUpdateManyMutationInput, ValueBetScanUncheckedUpdateManyInput>
    /**
     * Filter which ValueBetScans to update
     */
    where?: ValueBetScanWhereInput
    /**
     * Limit how many ValueBetScans to update.
     */
    limit?: number
  }

  /**
   * ValueBetScan updateManyAndReturn
   */
  export type ValueBetScanUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ValueBetScan
     */
    select?: ValueBetScanSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ValueBetScan
     */
    omit?: ValueBetScanOmit<ExtArgs> | null
    /**
     * The data used to update ValueBetScans.
     */
    data: XOR<ValueBetScanUpdateManyMutationInput, ValueBetScanUncheckedUpdateManyInput>
    /**
     * Filter which ValueBetScans to update
     */
    where?: ValueBetScanWhereInput
    /**
     * Limit how many ValueBetScans to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ValueBetScanIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ValueBetScan upsert
   */
  export type ValueBetScanUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ValueBetScan
     */
    select?: ValueBetScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ValueBetScan
     */
    omit?: ValueBetScanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ValueBetScanInclude<ExtArgs> | null
    /**
     * The filter to search for the ValueBetScan to update in case it exists.
     */
    where: ValueBetScanWhereUniqueInput
    /**
     * In case the ValueBetScan found by the `where` argument doesn't exist, create a new ValueBetScan with this data.
     */
    create: XOR<ValueBetScanCreateInput, ValueBetScanUncheckedCreateInput>
    /**
     * In case the ValueBetScan was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ValueBetScanUpdateInput, ValueBetScanUncheckedUpdateInput>
  }

  /**
   * ValueBetScan delete
   */
  export type ValueBetScanDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ValueBetScan
     */
    select?: ValueBetScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ValueBetScan
     */
    omit?: ValueBetScanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ValueBetScanInclude<ExtArgs> | null
    /**
     * Filter which ValueBetScan to delete.
     */
    where: ValueBetScanWhereUniqueInput
  }

  /**
   * ValueBetScan deleteMany
   */
  export type ValueBetScanDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ValueBetScans to delete
     */
    where?: ValueBetScanWhereInput
    /**
     * Limit how many ValueBetScans to delete.
     */
    limit?: number
  }

  /**
   * ValueBetScan without action
   */
  export type ValueBetScanDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ValueBetScan
     */
    select?: ValueBetScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ValueBetScan
     */
    omit?: ValueBetScanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ValueBetScanInclude<ExtArgs> | null
  }


  /**
   * Model SlipAnalysisLog
   */

  export type AggregateSlipAnalysisLog = {
    _count: SlipAnalysisLogCountAggregateOutputType | null
    _avg: SlipAnalysisLogAvgAggregateOutputType | null
    _sum: SlipAnalysisLogSumAggregateOutputType | null
    _min: SlipAnalysisLogMinAggregateOutputType | null
    _max: SlipAnalysisLogMaxAggregateOutputType | null
  }

  export type SlipAnalysisLogAvgAggregateOutputType = {
    totalGames: number | null
    keptGames: number | null
    removedGames: number | null
    replacedGames: number | null
    originalOdds: number | null
    newOdds: number | null
    targetOdds: number | null
    avgGrooveScore: number | null
  }

  export type SlipAnalysisLogSumAggregateOutputType = {
    totalGames: number | null
    keptGames: number | null
    removedGames: number | null
    replacedGames: number | null
    originalOdds: number | null
    newOdds: number | null
    targetOdds: number | null
    avgGrooveScore: number | null
  }

  export type SlipAnalysisLogMinAggregateOutputType = {
    id: string | null
    userId: string | null
    slipId: string | null
    totalGames: number | null
    keptGames: number | null
    removedGames: number | null
    replacedGames: number | null
    originalOdds: number | null
    newOdds: number | null
    targetOdds: number | null
    allowSwitching: boolean | null
    avgGrooveScore: number | null
    analysedAt: Date | null
  }

  export type SlipAnalysisLogMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    slipId: string | null
    totalGames: number | null
    keptGames: number | null
    removedGames: number | null
    replacedGames: number | null
    originalOdds: number | null
    newOdds: number | null
    targetOdds: number | null
    allowSwitching: boolean | null
    avgGrooveScore: number | null
    analysedAt: Date | null
  }

  export type SlipAnalysisLogCountAggregateOutputType = {
    id: number
    userId: number
    slipId: number
    totalGames: number
    keptGames: number
    removedGames: number
    replacedGames: number
    originalOdds: number
    newOdds: number
    targetOdds: number
    allowSwitching: number
    avgGrooveScore: number
    analysedAt: number
    _all: number
  }


  export type SlipAnalysisLogAvgAggregateInputType = {
    totalGames?: true
    keptGames?: true
    removedGames?: true
    replacedGames?: true
    originalOdds?: true
    newOdds?: true
    targetOdds?: true
    avgGrooveScore?: true
  }

  export type SlipAnalysisLogSumAggregateInputType = {
    totalGames?: true
    keptGames?: true
    removedGames?: true
    replacedGames?: true
    originalOdds?: true
    newOdds?: true
    targetOdds?: true
    avgGrooveScore?: true
  }

  export type SlipAnalysisLogMinAggregateInputType = {
    id?: true
    userId?: true
    slipId?: true
    totalGames?: true
    keptGames?: true
    removedGames?: true
    replacedGames?: true
    originalOdds?: true
    newOdds?: true
    targetOdds?: true
    allowSwitching?: true
    avgGrooveScore?: true
    analysedAt?: true
  }

  export type SlipAnalysisLogMaxAggregateInputType = {
    id?: true
    userId?: true
    slipId?: true
    totalGames?: true
    keptGames?: true
    removedGames?: true
    replacedGames?: true
    originalOdds?: true
    newOdds?: true
    targetOdds?: true
    allowSwitching?: true
    avgGrooveScore?: true
    analysedAt?: true
  }

  export type SlipAnalysisLogCountAggregateInputType = {
    id?: true
    userId?: true
    slipId?: true
    totalGames?: true
    keptGames?: true
    removedGames?: true
    replacedGames?: true
    originalOdds?: true
    newOdds?: true
    targetOdds?: true
    allowSwitching?: true
    avgGrooveScore?: true
    analysedAt?: true
    _all?: true
  }

  export type SlipAnalysisLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SlipAnalysisLog to aggregate.
     */
    where?: SlipAnalysisLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SlipAnalysisLogs to fetch.
     */
    orderBy?: SlipAnalysisLogOrderByWithRelationInput | SlipAnalysisLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SlipAnalysisLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SlipAnalysisLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SlipAnalysisLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SlipAnalysisLogs
    **/
    _count?: true | SlipAnalysisLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SlipAnalysisLogAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SlipAnalysisLogSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SlipAnalysisLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SlipAnalysisLogMaxAggregateInputType
  }

  export type GetSlipAnalysisLogAggregateType<T extends SlipAnalysisLogAggregateArgs> = {
        [P in keyof T & keyof AggregateSlipAnalysisLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSlipAnalysisLog[P]>
      : GetScalarType<T[P], AggregateSlipAnalysisLog[P]>
  }




  export type SlipAnalysisLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SlipAnalysisLogWhereInput
    orderBy?: SlipAnalysisLogOrderByWithAggregationInput | SlipAnalysisLogOrderByWithAggregationInput[]
    by: SlipAnalysisLogScalarFieldEnum[] | SlipAnalysisLogScalarFieldEnum
    having?: SlipAnalysisLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SlipAnalysisLogCountAggregateInputType | true
    _avg?: SlipAnalysisLogAvgAggregateInputType
    _sum?: SlipAnalysisLogSumAggregateInputType
    _min?: SlipAnalysisLogMinAggregateInputType
    _max?: SlipAnalysisLogMaxAggregateInputType
  }

  export type SlipAnalysisLogGroupByOutputType = {
    id: string
    userId: string
    slipId: string | null
    totalGames: number
    keptGames: number
    removedGames: number
    replacedGames: number
    originalOdds: number
    newOdds: number
    targetOdds: number
    allowSwitching: boolean
    avgGrooveScore: number
    analysedAt: Date
    _count: SlipAnalysisLogCountAggregateOutputType | null
    _avg: SlipAnalysisLogAvgAggregateOutputType | null
    _sum: SlipAnalysisLogSumAggregateOutputType | null
    _min: SlipAnalysisLogMinAggregateOutputType | null
    _max: SlipAnalysisLogMaxAggregateOutputType | null
  }

  type GetSlipAnalysisLogGroupByPayload<T extends SlipAnalysisLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SlipAnalysisLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SlipAnalysisLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SlipAnalysisLogGroupByOutputType[P]>
            : GetScalarType<T[P], SlipAnalysisLogGroupByOutputType[P]>
        }
      >
    >


  export type SlipAnalysisLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    slipId?: boolean
    totalGames?: boolean
    keptGames?: boolean
    removedGames?: boolean
    replacedGames?: boolean
    originalOdds?: boolean
    newOdds?: boolean
    targetOdds?: boolean
    allowSwitching?: boolean
    avgGrooveScore?: boolean
    analysedAt?: boolean
  }, ExtArgs["result"]["slipAnalysisLog"]>

  export type SlipAnalysisLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    slipId?: boolean
    totalGames?: boolean
    keptGames?: boolean
    removedGames?: boolean
    replacedGames?: boolean
    originalOdds?: boolean
    newOdds?: boolean
    targetOdds?: boolean
    allowSwitching?: boolean
    avgGrooveScore?: boolean
    analysedAt?: boolean
  }, ExtArgs["result"]["slipAnalysisLog"]>

  export type SlipAnalysisLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    slipId?: boolean
    totalGames?: boolean
    keptGames?: boolean
    removedGames?: boolean
    replacedGames?: boolean
    originalOdds?: boolean
    newOdds?: boolean
    targetOdds?: boolean
    allowSwitching?: boolean
    avgGrooveScore?: boolean
    analysedAt?: boolean
  }, ExtArgs["result"]["slipAnalysisLog"]>

  export type SlipAnalysisLogSelectScalar = {
    id?: boolean
    userId?: boolean
    slipId?: boolean
    totalGames?: boolean
    keptGames?: boolean
    removedGames?: boolean
    replacedGames?: boolean
    originalOdds?: boolean
    newOdds?: boolean
    targetOdds?: boolean
    allowSwitching?: boolean
    avgGrooveScore?: boolean
    analysedAt?: boolean
  }

  export type SlipAnalysisLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "slipId" | "totalGames" | "keptGames" | "removedGames" | "replacedGames" | "originalOdds" | "newOdds" | "targetOdds" | "allowSwitching" | "avgGrooveScore" | "analysedAt", ExtArgs["result"]["slipAnalysisLog"]>

  export type $SlipAnalysisLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SlipAnalysisLog"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      slipId: string | null
      totalGames: number
      keptGames: number
      removedGames: number
      replacedGames: number
      originalOdds: number
      newOdds: number
      targetOdds: number
      allowSwitching: boolean
      avgGrooveScore: number
      analysedAt: Date
    }, ExtArgs["result"]["slipAnalysisLog"]>
    composites: {}
  }

  type SlipAnalysisLogGetPayload<S extends boolean | null | undefined | SlipAnalysisLogDefaultArgs> = $Result.GetResult<Prisma.$SlipAnalysisLogPayload, S>

  type SlipAnalysisLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SlipAnalysisLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SlipAnalysisLogCountAggregateInputType | true
    }

  export interface SlipAnalysisLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SlipAnalysisLog'], meta: { name: 'SlipAnalysisLog' } }
    /**
     * Find zero or one SlipAnalysisLog that matches the filter.
     * @param {SlipAnalysisLogFindUniqueArgs} args - Arguments to find a SlipAnalysisLog
     * @example
     * // Get one SlipAnalysisLog
     * const slipAnalysisLog = await prisma.slipAnalysisLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SlipAnalysisLogFindUniqueArgs>(args: SelectSubset<T, SlipAnalysisLogFindUniqueArgs<ExtArgs>>): Prisma__SlipAnalysisLogClient<$Result.GetResult<Prisma.$SlipAnalysisLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SlipAnalysisLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SlipAnalysisLogFindUniqueOrThrowArgs} args - Arguments to find a SlipAnalysisLog
     * @example
     * // Get one SlipAnalysisLog
     * const slipAnalysisLog = await prisma.slipAnalysisLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SlipAnalysisLogFindUniqueOrThrowArgs>(args: SelectSubset<T, SlipAnalysisLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SlipAnalysisLogClient<$Result.GetResult<Prisma.$SlipAnalysisLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SlipAnalysisLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SlipAnalysisLogFindFirstArgs} args - Arguments to find a SlipAnalysisLog
     * @example
     * // Get one SlipAnalysisLog
     * const slipAnalysisLog = await prisma.slipAnalysisLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SlipAnalysisLogFindFirstArgs>(args?: SelectSubset<T, SlipAnalysisLogFindFirstArgs<ExtArgs>>): Prisma__SlipAnalysisLogClient<$Result.GetResult<Prisma.$SlipAnalysisLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SlipAnalysisLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SlipAnalysisLogFindFirstOrThrowArgs} args - Arguments to find a SlipAnalysisLog
     * @example
     * // Get one SlipAnalysisLog
     * const slipAnalysisLog = await prisma.slipAnalysisLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SlipAnalysisLogFindFirstOrThrowArgs>(args?: SelectSubset<T, SlipAnalysisLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__SlipAnalysisLogClient<$Result.GetResult<Prisma.$SlipAnalysisLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SlipAnalysisLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SlipAnalysisLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SlipAnalysisLogs
     * const slipAnalysisLogs = await prisma.slipAnalysisLog.findMany()
     * 
     * // Get first 10 SlipAnalysisLogs
     * const slipAnalysisLogs = await prisma.slipAnalysisLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const slipAnalysisLogWithIdOnly = await prisma.slipAnalysisLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SlipAnalysisLogFindManyArgs>(args?: SelectSubset<T, SlipAnalysisLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SlipAnalysisLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SlipAnalysisLog.
     * @param {SlipAnalysisLogCreateArgs} args - Arguments to create a SlipAnalysisLog.
     * @example
     * // Create one SlipAnalysisLog
     * const SlipAnalysisLog = await prisma.slipAnalysisLog.create({
     *   data: {
     *     // ... data to create a SlipAnalysisLog
     *   }
     * })
     * 
     */
    create<T extends SlipAnalysisLogCreateArgs>(args: SelectSubset<T, SlipAnalysisLogCreateArgs<ExtArgs>>): Prisma__SlipAnalysisLogClient<$Result.GetResult<Prisma.$SlipAnalysisLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SlipAnalysisLogs.
     * @param {SlipAnalysisLogCreateManyArgs} args - Arguments to create many SlipAnalysisLogs.
     * @example
     * // Create many SlipAnalysisLogs
     * const slipAnalysisLog = await prisma.slipAnalysisLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SlipAnalysisLogCreateManyArgs>(args?: SelectSubset<T, SlipAnalysisLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SlipAnalysisLogs and returns the data saved in the database.
     * @param {SlipAnalysisLogCreateManyAndReturnArgs} args - Arguments to create many SlipAnalysisLogs.
     * @example
     * // Create many SlipAnalysisLogs
     * const slipAnalysisLog = await prisma.slipAnalysisLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SlipAnalysisLogs and only return the `id`
     * const slipAnalysisLogWithIdOnly = await prisma.slipAnalysisLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SlipAnalysisLogCreateManyAndReturnArgs>(args?: SelectSubset<T, SlipAnalysisLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SlipAnalysisLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SlipAnalysisLog.
     * @param {SlipAnalysisLogDeleteArgs} args - Arguments to delete one SlipAnalysisLog.
     * @example
     * // Delete one SlipAnalysisLog
     * const SlipAnalysisLog = await prisma.slipAnalysisLog.delete({
     *   where: {
     *     // ... filter to delete one SlipAnalysisLog
     *   }
     * })
     * 
     */
    delete<T extends SlipAnalysisLogDeleteArgs>(args: SelectSubset<T, SlipAnalysisLogDeleteArgs<ExtArgs>>): Prisma__SlipAnalysisLogClient<$Result.GetResult<Prisma.$SlipAnalysisLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SlipAnalysisLog.
     * @param {SlipAnalysisLogUpdateArgs} args - Arguments to update one SlipAnalysisLog.
     * @example
     * // Update one SlipAnalysisLog
     * const slipAnalysisLog = await prisma.slipAnalysisLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SlipAnalysisLogUpdateArgs>(args: SelectSubset<T, SlipAnalysisLogUpdateArgs<ExtArgs>>): Prisma__SlipAnalysisLogClient<$Result.GetResult<Prisma.$SlipAnalysisLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SlipAnalysisLogs.
     * @param {SlipAnalysisLogDeleteManyArgs} args - Arguments to filter SlipAnalysisLogs to delete.
     * @example
     * // Delete a few SlipAnalysisLogs
     * const { count } = await prisma.slipAnalysisLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SlipAnalysisLogDeleteManyArgs>(args?: SelectSubset<T, SlipAnalysisLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SlipAnalysisLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SlipAnalysisLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SlipAnalysisLogs
     * const slipAnalysisLog = await prisma.slipAnalysisLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SlipAnalysisLogUpdateManyArgs>(args: SelectSubset<T, SlipAnalysisLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SlipAnalysisLogs and returns the data updated in the database.
     * @param {SlipAnalysisLogUpdateManyAndReturnArgs} args - Arguments to update many SlipAnalysisLogs.
     * @example
     * // Update many SlipAnalysisLogs
     * const slipAnalysisLog = await prisma.slipAnalysisLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SlipAnalysisLogs and only return the `id`
     * const slipAnalysisLogWithIdOnly = await prisma.slipAnalysisLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SlipAnalysisLogUpdateManyAndReturnArgs>(args: SelectSubset<T, SlipAnalysisLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SlipAnalysisLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SlipAnalysisLog.
     * @param {SlipAnalysisLogUpsertArgs} args - Arguments to update or create a SlipAnalysisLog.
     * @example
     * // Update or create a SlipAnalysisLog
     * const slipAnalysisLog = await prisma.slipAnalysisLog.upsert({
     *   create: {
     *     // ... data to create a SlipAnalysisLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SlipAnalysisLog we want to update
     *   }
     * })
     */
    upsert<T extends SlipAnalysisLogUpsertArgs>(args: SelectSubset<T, SlipAnalysisLogUpsertArgs<ExtArgs>>): Prisma__SlipAnalysisLogClient<$Result.GetResult<Prisma.$SlipAnalysisLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SlipAnalysisLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SlipAnalysisLogCountArgs} args - Arguments to filter SlipAnalysisLogs to count.
     * @example
     * // Count the number of SlipAnalysisLogs
     * const count = await prisma.slipAnalysisLog.count({
     *   where: {
     *     // ... the filter for the SlipAnalysisLogs we want to count
     *   }
     * })
    **/
    count<T extends SlipAnalysisLogCountArgs>(
      args?: Subset<T, SlipAnalysisLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SlipAnalysisLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SlipAnalysisLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SlipAnalysisLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SlipAnalysisLogAggregateArgs>(args: Subset<T, SlipAnalysisLogAggregateArgs>): Prisma.PrismaPromise<GetSlipAnalysisLogAggregateType<T>>

    /**
     * Group by SlipAnalysisLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SlipAnalysisLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SlipAnalysisLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SlipAnalysisLogGroupByArgs['orderBy'] }
        : { orderBy?: SlipAnalysisLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SlipAnalysisLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSlipAnalysisLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SlipAnalysisLog model
   */
  readonly fields: SlipAnalysisLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SlipAnalysisLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SlipAnalysisLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SlipAnalysisLog model
   */
  interface SlipAnalysisLogFieldRefs {
    readonly id: FieldRef<"SlipAnalysisLog", 'String'>
    readonly userId: FieldRef<"SlipAnalysisLog", 'String'>
    readonly slipId: FieldRef<"SlipAnalysisLog", 'String'>
    readonly totalGames: FieldRef<"SlipAnalysisLog", 'Int'>
    readonly keptGames: FieldRef<"SlipAnalysisLog", 'Int'>
    readonly removedGames: FieldRef<"SlipAnalysisLog", 'Int'>
    readonly replacedGames: FieldRef<"SlipAnalysisLog", 'Int'>
    readonly originalOdds: FieldRef<"SlipAnalysisLog", 'Float'>
    readonly newOdds: FieldRef<"SlipAnalysisLog", 'Float'>
    readonly targetOdds: FieldRef<"SlipAnalysisLog", 'Float'>
    readonly allowSwitching: FieldRef<"SlipAnalysisLog", 'Boolean'>
    readonly avgGrooveScore: FieldRef<"SlipAnalysisLog", 'Float'>
    readonly analysedAt: FieldRef<"SlipAnalysisLog", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SlipAnalysisLog findUnique
   */
  export type SlipAnalysisLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SlipAnalysisLog
     */
    select?: SlipAnalysisLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SlipAnalysisLog
     */
    omit?: SlipAnalysisLogOmit<ExtArgs> | null
    /**
     * Filter, which SlipAnalysisLog to fetch.
     */
    where: SlipAnalysisLogWhereUniqueInput
  }

  /**
   * SlipAnalysisLog findUniqueOrThrow
   */
  export type SlipAnalysisLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SlipAnalysisLog
     */
    select?: SlipAnalysisLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SlipAnalysisLog
     */
    omit?: SlipAnalysisLogOmit<ExtArgs> | null
    /**
     * Filter, which SlipAnalysisLog to fetch.
     */
    where: SlipAnalysisLogWhereUniqueInput
  }

  /**
   * SlipAnalysisLog findFirst
   */
  export type SlipAnalysisLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SlipAnalysisLog
     */
    select?: SlipAnalysisLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SlipAnalysisLog
     */
    omit?: SlipAnalysisLogOmit<ExtArgs> | null
    /**
     * Filter, which SlipAnalysisLog to fetch.
     */
    where?: SlipAnalysisLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SlipAnalysisLogs to fetch.
     */
    orderBy?: SlipAnalysisLogOrderByWithRelationInput | SlipAnalysisLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SlipAnalysisLogs.
     */
    cursor?: SlipAnalysisLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SlipAnalysisLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SlipAnalysisLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SlipAnalysisLogs.
     */
    distinct?: SlipAnalysisLogScalarFieldEnum | SlipAnalysisLogScalarFieldEnum[]
  }

  /**
   * SlipAnalysisLog findFirstOrThrow
   */
  export type SlipAnalysisLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SlipAnalysisLog
     */
    select?: SlipAnalysisLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SlipAnalysisLog
     */
    omit?: SlipAnalysisLogOmit<ExtArgs> | null
    /**
     * Filter, which SlipAnalysisLog to fetch.
     */
    where?: SlipAnalysisLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SlipAnalysisLogs to fetch.
     */
    orderBy?: SlipAnalysisLogOrderByWithRelationInput | SlipAnalysisLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SlipAnalysisLogs.
     */
    cursor?: SlipAnalysisLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SlipAnalysisLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SlipAnalysisLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SlipAnalysisLogs.
     */
    distinct?: SlipAnalysisLogScalarFieldEnum | SlipAnalysisLogScalarFieldEnum[]
  }

  /**
   * SlipAnalysisLog findMany
   */
  export type SlipAnalysisLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SlipAnalysisLog
     */
    select?: SlipAnalysisLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SlipAnalysisLog
     */
    omit?: SlipAnalysisLogOmit<ExtArgs> | null
    /**
     * Filter, which SlipAnalysisLogs to fetch.
     */
    where?: SlipAnalysisLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SlipAnalysisLogs to fetch.
     */
    orderBy?: SlipAnalysisLogOrderByWithRelationInput | SlipAnalysisLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SlipAnalysisLogs.
     */
    cursor?: SlipAnalysisLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SlipAnalysisLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SlipAnalysisLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SlipAnalysisLogs.
     */
    distinct?: SlipAnalysisLogScalarFieldEnum | SlipAnalysisLogScalarFieldEnum[]
  }

  /**
   * SlipAnalysisLog create
   */
  export type SlipAnalysisLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SlipAnalysisLog
     */
    select?: SlipAnalysisLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SlipAnalysisLog
     */
    omit?: SlipAnalysisLogOmit<ExtArgs> | null
    /**
     * The data needed to create a SlipAnalysisLog.
     */
    data: XOR<SlipAnalysisLogCreateInput, SlipAnalysisLogUncheckedCreateInput>
  }

  /**
   * SlipAnalysisLog createMany
   */
  export type SlipAnalysisLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SlipAnalysisLogs.
     */
    data: SlipAnalysisLogCreateManyInput | SlipAnalysisLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SlipAnalysisLog createManyAndReturn
   */
  export type SlipAnalysisLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SlipAnalysisLog
     */
    select?: SlipAnalysisLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SlipAnalysisLog
     */
    omit?: SlipAnalysisLogOmit<ExtArgs> | null
    /**
     * The data used to create many SlipAnalysisLogs.
     */
    data: SlipAnalysisLogCreateManyInput | SlipAnalysisLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SlipAnalysisLog update
   */
  export type SlipAnalysisLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SlipAnalysisLog
     */
    select?: SlipAnalysisLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SlipAnalysisLog
     */
    omit?: SlipAnalysisLogOmit<ExtArgs> | null
    /**
     * The data needed to update a SlipAnalysisLog.
     */
    data: XOR<SlipAnalysisLogUpdateInput, SlipAnalysisLogUncheckedUpdateInput>
    /**
     * Choose, which SlipAnalysisLog to update.
     */
    where: SlipAnalysisLogWhereUniqueInput
  }

  /**
   * SlipAnalysisLog updateMany
   */
  export type SlipAnalysisLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SlipAnalysisLogs.
     */
    data: XOR<SlipAnalysisLogUpdateManyMutationInput, SlipAnalysisLogUncheckedUpdateManyInput>
    /**
     * Filter which SlipAnalysisLogs to update
     */
    where?: SlipAnalysisLogWhereInput
    /**
     * Limit how many SlipAnalysisLogs to update.
     */
    limit?: number
  }

  /**
   * SlipAnalysisLog updateManyAndReturn
   */
  export type SlipAnalysisLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SlipAnalysisLog
     */
    select?: SlipAnalysisLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SlipAnalysisLog
     */
    omit?: SlipAnalysisLogOmit<ExtArgs> | null
    /**
     * The data used to update SlipAnalysisLogs.
     */
    data: XOR<SlipAnalysisLogUpdateManyMutationInput, SlipAnalysisLogUncheckedUpdateManyInput>
    /**
     * Filter which SlipAnalysisLogs to update
     */
    where?: SlipAnalysisLogWhereInput
    /**
     * Limit how many SlipAnalysisLogs to update.
     */
    limit?: number
  }

  /**
   * SlipAnalysisLog upsert
   */
  export type SlipAnalysisLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SlipAnalysisLog
     */
    select?: SlipAnalysisLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SlipAnalysisLog
     */
    omit?: SlipAnalysisLogOmit<ExtArgs> | null
    /**
     * The filter to search for the SlipAnalysisLog to update in case it exists.
     */
    where: SlipAnalysisLogWhereUniqueInput
    /**
     * In case the SlipAnalysisLog found by the `where` argument doesn't exist, create a new SlipAnalysisLog with this data.
     */
    create: XOR<SlipAnalysisLogCreateInput, SlipAnalysisLogUncheckedCreateInput>
    /**
     * In case the SlipAnalysisLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SlipAnalysisLogUpdateInput, SlipAnalysisLogUncheckedUpdateInput>
  }

  /**
   * SlipAnalysisLog delete
   */
  export type SlipAnalysisLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SlipAnalysisLog
     */
    select?: SlipAnalysisLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SlipAnalysisLog
     */
    omit?: SlipAnalysisLogOmit<ExtArgs> | null
    /**
     * Filter which SlipAnalysisLog to delete.
     */
    where: SlipAnalysisLogWhereUniqueInput
  }

  /**
   * SlipAnalysisLog deleteMany
   */
  export type SlipAnalysisLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SlipAnalysisLogs to delete
     */
    where?: SlipAnalysisLogWhereInput
    /**
     * Limit how many SlipAnalysisLogs to delete.
     */
    limit?: number
  }

  /**
   * SlipAnalysisLog without action
   */
  export type SlipAnalysisLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SlipAnalysisLog
     */
    select?: SlipAnalysisLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SlipAnalysisLog
     */
    omit?: SlipAnalysisLogOmit<ExtArgs> | null
  }


  /**
   * Model AccumulatorBuild
   */

  export type AggregateAccumulatorBuild = {
    _count: AccumulatorBuildCountAggregateOutputType | null
    _avg: AccumulatorBuildAvgAggregateOutputType | null
    _sum: AccumulatorBuildSumAggregateOutputType | null
    _min: AccumulatorBuildMinAggregateOutputType | null
    _max: AccumulatorBuildMaxAggregateOutputType | null
  }

  export type AccumulatorBuildAvgAggregateOutputType = {
    targetOdds: number | null
    actualOdds: number | null
    legsCount: number | null
    avgGrooveScore: number | null
  }

  export type AccumulatorBuildSumAggregateOutputType = {
    targetOdds: number | null
    actualOdds: number | null
    legsCount: number | null
    avgGrooveScore: number | null
  }

  export type AccumulatorBuildMinAggregateOutputType = {
    id: string | null
    userId: string | null
    targetOdds: number | null
    actualOdds: number | null
    riskLevel: $Enums.RiskLevel | null
    legsCount: number | null
    avgGrooveScore: number | null
    builtAt: Date | null
  }

  export type AccumulatorBuildMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    targetOdds: number | null
    actualOdds: number | null
    riskLevel: $Enums.RiskLevel | null
    legsCount: number | null
    avgGrooveScore: number | null
    builtAt: Date | null
  }

  export type AccumulatorBuildCountAggregateOutputType = {
    id: number
    userId: number
    targetOdds: number
    actualOdds: number
    riskLevel: number
    legsCount: number
    avgGrooveScore: number
    picks: number
    builtAt: number
    _all: number
  }


  export type AccumulatorBuildAvgAggregateInputType = {
    targetOdds?: true
    actualOdds?: true
    legsCount?: true
    avgGrooveScore?: true
  }

  export type AccumulatorBuildSumAggregateInputType = {
    targetOdds?: true
    actualOdds?: true
    legsCount?: true
    avgGrooveScore?: true
  }

  export type AccumulatorBuildMinAggregateInputType = {
    id?: true
    userId?: true
    targetOdds?: true
    actualOdds?: true
    riskLevel?: true
    legsCount?: true
    avgGrooveScore?: true
    builtAt?: true
  }

  export type AccumulatorBuildMaxAggregateInputType = {
    id?: true
    userId?: true
    targetOdds?: true
    actualOdds?: true
    riskLevel?: true
    legsCount?: true
    avgGrooveScore?: true
    builtAt?: true
  }

  export type AccumulatorBuildCountAggregateInputType = {
    id?: true
    userId?: true
    targetOdds?: true
    actualOdds?: true
    riskLevel?: true
    legsCount?: true
    avgGrooveScore?: true
    picks?: true
    builtAt?: true
    _all?: true
  }

  export type AccumulatorBuildAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AccumulatorBuild to aggregate.
     */
    where?: AccumulatorBuildWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AccumulatorBuilds to fetch.
     */
    orderBy?: AccumulatorBuildOrderByWithRelationInput | AccumulatorBuildOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AccumulatorBuildWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AccumulatorBuilds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AccumulatorBuilds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AccumulatorBuilds
    **/
    _count?: true | AccumulatorBuildCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AccumulatorBuildAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AccumulatorBuildSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AccumulatorBuildMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AccumulatorBuildMaxAggregateInputType
  }

  export type GetAccumulatorBuildAggregateType<T extends AccumulatorBuildAggregateArgs> = {
        [P in keyof T & keyof AggregateAccumulatorBuild]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAccumulatorBuild[P]>
      : GetScalarType<T[P], AggregateAccumulatorBuild[P]>
  }




  export type AccumulatorBuildGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AccumulatorBuildWhereInput
    orderBy?: AccumulatorBuildOrderByWithAggregationInput | AccumulatorBuildOrderByWithAggregationInput[]
    by: AccumulatorBuildScalarFieldEnum[] | AccumulatorBuildScalarFieldEnum
    having?: AccumulatorBuildScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AccumulatorBuildCountAggregateInputType | true
    _avg?: AccumulatorBuildAvgAggregateInputType
    _sum?: AccumulatorBuildSumAggregateInputType
    _min?: AccumulatorBuildMinAggregateInputType
    _max?: AccumulatorBuildMaxAggregateInputType
  }

  export type AccumulatorBuildGroupByOutputType = {
    id: string
    userId: string
    targetOdds: number
    actualOdds: number
    riskLevel: $Enums.RiskLevel
    legsCount: number
    avgGrooveScore: number
    picks: JsonValue
    builtAt: Date
    _count: AccumulatorBuildCountAggregateOutputType | null
    _avg: AccumulatorBuildAvgAggregateOutputType | null
    _sum: AccumulatorBuildSumAggregateOutputType | null
    _min: AccumulatorBuildMinAggregateOutputType | null
    _max: AccumulatorBuildMaxAggregateOutputType | null
  }

  type GetAccumulatorBuildGroupByPayload<T extends AccumulatorBuildGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AccumulatorBuildGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AccumulatorBuildGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AccumulatorBuildGroupByOutputType[P]>
            : GetScalarType<T[P], AccumulatorBuildGroupByOutputType[P]>
        }
      >
    >


  export type AccumulatorBuildSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    targetOdds?: boolean
    actualOdds?: boolean
    riskLevel?: boolean
    legsCount?: boolean
    avgGrooveScore?: boolean
    picks?: boolean
    builtAt?: boolean
  }, ExtArgs["result"]["accumulatorBuild"]>

  export type AccumulatorBuildSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    targetOdds?: boolean
    actualOdds?: boolean
    riskLevel?: boolean
    legsCount?: boolean
    avgGrooveScore?: boolean
    picks?: boolean
    builtAt?: boolean
  }, ExtArgs["result"]["accumulatorBuild"]>

  export type AccumulatorBuildSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    targetOdds?: boolean
    actualOdds?: boolean
    riskLevel?: boolean
    legsCount?: boolean
    avgGrooveScore?: boolean
    picks?: boolean
    builtAt?: boolean
  }, ExtArgs["result"]["accumulatorBuild"]>

  export type AccumulatorBuildSelectScalar = {
    id?: boolean
    userId?: boolean
    targetOdds?: boolean
    actualOdds?: boolean
    riskLevel?: boolean
    legsCount?: boolean
    avgGrooveScore?: boolean
    picks?: boolean
    builtAt?: boolean
  }

  export type AccumulatorBuildOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "targetOdds" | "actualOdds" | "riskLevel" | "legsCount" | "avgGrooveScore" | "picks" | "builtAt", ExtArgs["result"]["accumulatorBuild"]>

  export type $AccumulatorBuildPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AccumulatorBuild"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      targetOdds: number
      actualOdds: number
      riskLevel: $Enums.RiskLevel
      legsCount: number
      avgGrooveScore: number
      picks: Prisma.JsonValue
      builtAt: Date
    }, ExtArgs["result"]["accumulatorBuild"]>
    composites: {}
  }

  type AccumulatorBuildGetPayload<S extends boolean | null | undefined | AccumulatorBuildDefaultArgs> = $Result.GetResult<Prisma.$AccumulatorBuildPayload, S>

  type AccumulatorBuildCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AccumulatorBuildFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AccumulatorBuildCountAggregateInputType | true
    }

  export interface AccumulatorBuildDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AccumulatorBuild'], meta: { name: 'AccumulatorBuild' } }
    /**
     * Find zero or one AccumulatorBuild that matches the filter.
     * @param {AccumulatorBuildFindUniqueArgs} args - Arguments to find a AccumulatorBuild
     * @example
     * // Get one AccumulatorBuild
     * const accumulatorBuild = await prisma.accumulatorBuild.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AccumulatorBuildFindUniqueArgs>(args: SelectSubset<T, AccumulatorBuildFindUniqueArgs<ExtArgs>>): Prisma__AccumulatorBuildClient<$Result.GetResult<Prisma.$AccumulatorBuildPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AccumulatorBuild that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AccumulatorBuildFindUniqueOrThrowArgs} args - Arguments to find a AccumulatorBuild
     * @example
     * // Get one AccumulatorBuild
     * const accumulatorBuild = await prisma.accumulatorBuild.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AccumulatorBuildFindUniqueOrThrowArgs>(args: SelectSubset<T, AccumulatorBuildFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AccumulatorBuildClient<$Result.GetResult<Prisma.$AccumulatorBuildPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AccumulatorBuild that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccumulatorBuildFindFirstArgs} args - Arguments to find a AccumulatorBuild
     * @example
     * // Get one AccumulatorBuild
     * const accumulatorBuild = await prisma.accumulatorBuild.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AccumulatorBuildFindFirstArgs>(args?: SelectSubset<T, AccumulatorBuildFindFirstArgs<ExtArgs>>): Prisma__AccumulatorBuildClient<$Result.GetResult<Prisma.$AccumulatorBuildPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AccumulatorBuild that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccumulatorBuildFindFirstOrThrowArgs} args - Arguments to find a AccumulatorBuild
     * @example
     * // Get one AccumulatorBuild
     * const accumulatorBuild = await prisma.accumulatorBuild.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AccumulatorBuildFindFirstOrThrowArgs>(args?: SelectSubset<T, AccumulatorBuildFindFirstOrThrowArgs<ExtArgs>>): Prisma__AccumulatorBuildClient<$Result.GetResult<Prisma.$AccumulatorBuildPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AccumulatorBuilds that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccumulatorBuildFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AccumulatorBuilds
     * const accumulatorBuilds = await prisma.accumulatorBuild.findMany()
     * 
     * // Get first 10 AccumulatorBuilds
     * const accumulatorBuilds = await prisma.accumulatorBuild.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const accumulatorBuildWithIdOnly = await prisma.accumulatorBuild.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AccumulatorBuildFindManyArgs>(args?: SelectSubset<T, AccumulatorBuildFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AccumulatorBuildPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AccumulatorBuild.
     * @param {AccumulatorBuildCreateArgs} args - Arguments to create a AccumulatorBuild.
     * @example
     * // Create one AccumulatorBuild
     * const AccumulatorBuild = await prisma.accumulatorBuild.create({
     *   data: {
     *     // ... data to create a AccumulatorBuild
     *   }
     * })
     * 
     */
    create<T extends AccumulatorBuildCreateArgs>(args: SelectSubset<T, AccumulatorBuildCreateArgs<ExtArgs>>): Prisma__AccumulatorBuildClient<$Result.GetResult<Prisma.$AccumulatorBuildPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AccumulatorBuilds.
     * @param {AccumulatorBuildCreateManyArgs} args - Arguments to create many AccumulatorBuilds.
     * @example
     * // Create many AccumulatorBuilds
     * const accumulatorBuild = await prisma.accumulatorBuild.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AccumulatorBuildCreateManyArgs>(args?: SelectSubset<T, AccumulatorBuildCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AccumulatorBuilds and returns the data saved in the database.
     * @param {AccumulatorBuildCreateManyAndReturnArgs} args - Arguments to create many AccumulatorBuilds.
     * @example
     * // Create many AccumulatorBuilds
     * const accumulatorBuild = await prisma.accumulatorBuild.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AccumulatorBuilds and only return the `id`
     * const accumulatorBuildWithIdOnly = await prisma.accumulatorBuild.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AccumulatorBuildCreateManyAndReturnArgs>(args?: SelectSubset<T, AccumulatorBuildCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AccumulatorBuildPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AccumulatorBuild.
     * @param {AccumulatorBuildDeleteArgs} args - Arguments to delete one AccumulatorBuild.
     * @example
     * // Delete one AccumulatorBuild
     * const AccumulatorBuild = await prisma.accumulatorBuild.delete({
     *   where: {
     *     // ... filter to delete one AccumulatorBuild
     *   }
     * })
     * 
     */
    delete<T extends AccumulatorBuildDeleteArgs>(args: SelectSubset<T, AccumulatorBuildDeleteArgs<ExtArgs>>): Prisma__AccumulatorBuildClient<$Result.GetResult<Prisma.$AccumulatorBuildPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AccumulatorBuild.
     * @param {AccumulatorBuildUpdateArgs} args - Arguments to update one AccumulatorBuild.
     * @example
     * // Update one AccumulatorBuild
     * const accumulatorBuild = await prisma.accumulatorBuild.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AccumulatorBuildUpdateArgs>(args: SelectSubset<T, AccumulatorBuildUpdateArgs<ExtArgs>>): Prisma__AccumulatorBuildClient<$Result.GetResult<Prisma.$AccumulatorBuildPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AccumulatorBuilds.
     * @param {AccumulatorBuildDeleteManyArgs} args - Arguments to filter AccumulatorBuilds to delete.
     * @example
     * // Delete a few AccumulatorBuilds
     * const { count } = await prisma.accumulatorBuild.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AccumulatorBuildDeleteManyArgs>(args?: SelectSubset<T, AccumulatorBuildDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AccumulatorBuilds.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccumulatorBuildUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AccumulatorBuilds
     * const accumulatorBuild = await prisma.accumulatorBuild.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AccumulatorBuildUpdateManyArgs>(args: SelectSubset<T, AccumulatorBuildUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AccumulatorBuilds and returns the data updated in the database.
     * @param {AccumulatorBuildUpdateManyAndReturnArgs} args - Arguments to update many AccumulatorBuilds.
     * @example
     * // Update many AccumulatorBuilds
     * const accumulatorBuild = await prisma.accumulatorBuild.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AccumulatorBuilds and only return the `id`
     * const accumulatorBuildWithIdOnly = await prisma.accumulatorBuild.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AccumulatorBuildUpdateManyAndReturnArgs>(args: SelectSubset<T, AccumulatorBuildUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AccumulatorBuildPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AccumulatorBuild.
     * @param {AccumulatorBuildUpsertArgs} args - Arguments to update or create a AccumulatorBuild.
     * @example
     * // Update or create a AccumulatorBuild
     * const accumulatorBuild = await prisma.accumulatorBuild.upsert({
     *   create: {
     *     // ... data to create a AccumulatorBuild
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AccumulatorBuild we want to update
     *   }
     * })
     */
    upsert<T extends AccumulatorBuildUpsertArgs>(args: SelectSubset<T, AccumulatorBuildUpsertArgs<ExtArgs>>): Prisma__AccumulatorBuildClient<$Result.GetResult<Prisma.$AccumulatorBuildPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AccumulatorBuilds.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccumulatorBuildCountArgs} args - Arguments to filter AccumulatorBuilds to count.
     * @example
     * // Count the number of AccumulatorBuilds
     * const count = await prisma.accumulatorBuild.count({
     *   where: {
     *     // ... the filter for the AccumulatorBuilds we want to count
     *   }
     * })
    **/
    count<T extends AccumulatorBuildCountArgs>(
      args?: Subset<T, AccumulatorBuildCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AccumulatorBuildCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AccumulatorBuild.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccumulatorBuildAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AccumulatorBuildAggregateArgs>(args: Subset<T, AccumulatorBuildAggregateArgs>): Prisma.PrismaPromise<GetAccumulatorBuildAggregateType<T>>

    /**
     * Group by AccumulatorBuild.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccumulatorBuildGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AccumulatorBuildGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AccumulatorBuildGroupByArgs['orderBy'] }
        : { orderBy?: AccumulatorBuildGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AccumulatorBuildGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAccumulatorBuildGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AccumulatorBuild model
   */
  readonly fields: AccumulatorBuildFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AccumulatorBuild.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AccumulatorBuildClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AccumulatorBuild model
   */
  interface AccumulatorBuildFieldRefs {
    readonly id: FieldRef<"AccumulatorBuild", 'String'>
    readonly userId: FieldRef<"AccumulatorBuild", 'String'>
    readonly targetOdds: FieldRef<"AccumulatorBuild", 'Float'>
    readonly actualOdds: FieldRef<"AccumulatorBuild", 'Float'>
    readonly riskLevel: FieldRef<"AccumulatorBuild", 'RiskLevel'>
    readonly legsCount: FieldRef<"AccumulatorBuild", 'Int'>
    readonly avgGrooveScore: FieldRef<"AccumulatorBuild", 'Float'>
    readonly picks: FieldRef<"AccumulatorBuild", 'Json'>
    readonly builtAt: FieldRef<"AccumulatorBuild", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AccumulatorBuild findUnique
   */
  export type AccumulatorBuildFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AccumulatorBuild
     */
    select?: AccumulatorBuildSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AccumulatorBuild
     */
    omit?: AccumulatorBuildOmit<ExtArgs> | null
    /**
     * Filter, which AccumulatorBuild to fetch.
     */
    where: AccumulatorBuildWhereUniqueInput
  }

  /**
   * AccumulatorBuild findUniqueOrThrow
   */
  export type AccumulatorBuildFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AccumulatorBuild
     */
    select?: AccumulatorBuildSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AccumulatorBuild
     */
    omit?: AccumulatorBuildOmit<ExtArgs> | null
    /**
     * Filter, which AccumulatorBuild to fetch.
     */
    where: AccumulatorBuildWhereUniqueInput
  }

  /**
   * AccumulatorBuild findFirst
   */
  export type AccumulatorBuildFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AccumulatorBuild
     */
    select?: AccumulatorBuildSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AccumulatorBuild
     */
    omit?: AccumulatorBuildOmit<ExtArgs> | null
    /**
     * Filter, which AccumulatorBuild to fetch.
     */
    where?: AccumulatorBuildWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AccumulatorBuilds to fetch.
     */
    orderBy?: AccumulatorBuildOrderByWithRelationInput | AccumulatorBuildOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AccumulatorBuilds.
     */
    cursor?: AccumulatorBuildWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AccumulatorBuilds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AccumulatorBuilds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AccumulatorBuilds.
     */
    distinct?: AccumulatorBuildScalarFieldEnum | AccumulatorBuildScalarFieldEnum[]
  }

  /**
   * AccumulatorBuild findFirstOrThrow
   */
  export type AccumulatorBuildFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AccumulatorBuild
     */
    select?: AccumulatorBuildSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AccumulatorBuild
     */
    omit?: AccumulatorBuildOmit<ExtArgs> | null
    /**
     * Filter, which AccumulatorBuild to fetch.
     */
    where?: AccumulatorBuildWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AccumulatorBuilds to fetch.
     */
    orderBy?: AccumulatorBuildOrderByWithRelationInput | AccumulatorBuildOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AccumulatorBuilds.
     */
    cursor?: AccumulatorBuildWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AccumulatorBuilds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AccumulatorBuilds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AccumulatorBuilds.
     */
    distinct?: AccumulatorBuildScalarFieldEnum | AccumulatorBuildScalarFieldEnum[]
  }

  /**
   * AccumulatorBuild findMany
   */
  export type AccumulatorBuildFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AccumulatorBuild
     */
    select?: AccumulatorBuildSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AccumulatorBuild
     */
    omit?: AccumulatorBuildOmit<ExtArgs> | null
    /**
     * Filter, which AccumulatorBuilds to fetch.
     */
    where?: AccumulatorBuildWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AccumulatorBuilds to fetch.
     */
    orderBy?: AccumulatorBuildOrderByWithRelationInput | AccumulatorBuildOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AccumulatorBuilds.
     */
    cursor?: AccumulatorBuildWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AccumulatorBuilds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AccumulatorBuilds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AccumulatorBuilds.
     */
    distinct?: AccumulatorBuildScalarFieldEnum | AccumulatorBuildScalarFieldEnum[]
  }

  /**
   * AccumulatorBuild create
   */
  export type AccumulatorBuildCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AccumulatorBuild
     */
    select?: AccumulatorBuildSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AccumulatorBuild
     */
    omit?: AccumulatorBuildOmit<ExtArgs> | null
    /**
     * The data needed to create a AccumulatorBuild.
     */
    data: XOR<AccumulatorBuildCreateInput, AccumulatorBuildUncheckedCreateInput>
  }

  /**
   * AccumulatorBuild createMany
   */
  export type AccumulatorBuildCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AccumulatorBuilds.
     */
    data: AccumulatorBuildCreateManyInput | AccumulatorBuildCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AccumulatorBuild createManyAndReturn
   */
  export type AccumulatorBuildCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AccumulatorBuild
     */
    select?: AccumulatorBuildSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AccumulatorBuild
     */
    omit?: AccumulatorBuildOmit<ExtArgs> | null
    /**
     * The data used to create many AccumulatorBuilds.
     */
    data: AccumulatorBuildCreateManyInput | AccumulatorBuildCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AccumulatorBuild update
   */
  export type AccumulatorBuildUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AccumulatorBuild
     */
    select?: AccumulatorBuildSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AccumulatorBuild
     */
    omit?: AccumulatorBuildOmit<ExtArgs> | null
    /**
     * The data needed to update a AccumulatorBuild.
     */
    data: XOR<AccumulatorBuildUpdateInput, AccumulatorBuildUncheckedUpdateInput>
    /**
     * Choose, which AccumulatorBuild to update.
     */
    where: AccumulatorBuildWhereUniqueInput
  }

  /**
   * AccumulatorBuild updateMany
   */
  export type AccumulatorBuildUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AccumulatorBuilds.
     */
    data: XOR<AccumulatorBuildUpdateManyMutationInput, AccumulatorBuildUncheckedUpdateManyInput>
    /**
     * Filter which AccumulatorBuilds to update
     */
    where?: AccumulatorBuildWhereInput
    /**
     * Limit how many AccumulatorBuilds to update.
     */
    limit?: number
  }

  /**
   * AccumulatorBuild updateManyAndReturn
   */
  export type AccumulatorBuildUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AccumulatorBuild
     */
    select?: AccumulatorBuildSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AccumulatorBuild
     */
    omit?: AccumulatorBuildOmit<ExtArgs> | null
    /**
     * The data used to update AccumulatorBuilds.
     */
    data: XOR<AccumulatorBuildUpdateManyMutationInput, AccumulatorBuildUncheckedUpdateManyInput>
    /**
     * Filter which AccumulatorBuilds to update
     */
    where?: AccumulatorBuildWhereInput
    /**
     * Limit how many AccumulatorBuilds to update.
     */
    limit?: number
  }

  /**
   * AccumulatorBuild upsert
   */
  export type AccumulatorBuildUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AccumulatorBuild
     */
    select?: AccumulatorBuildSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AccumulatorBuild
     */
    omit?: AccumulatorBuildOmit<ExtArgs> | null
    /**
     * The filter to search for the AccumulatorBuild to update in case it exists.
     */
    where: AccumulatorBuildWhereUniqueInput
    /**
     * In case the AccumulatorBuild found by the `where` argument doesn't exist, create a new AccumulatorBuild with this data.
     */
    create: XOR<AccumulatorBuildCreateInput, AccumulatorBuildUncheckedCreateInput>
    /**
     * In case the AccumulatorBuild was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AccumulatorBuildUpdateInput, AccumulatorBuildUncheckedUpdateInput>
  }

  /**
   * AccumulatorBuild delete
   */
  export type AccumulatorBuildDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AccumulatorBuild
     */
    select?: AccumulatorBuildSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AccumulatorBuild
     */
    omit?: AccumulatorBuildOmit<ExtArgs> | null
    /**
     * Filter which AccumulatorBuild to delete.
     */
    where: AccumulatorBuildWhereUniqueInput
  }

  /**
   * AccumulatorBuild deleteMany
   */
  export type AccumulatorBuildDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AccumulatorBuilds to delete
     */
    where?: AccumulatorBuildWhereInput
    /**
     * Limit how many AccumulatorBuilds to delete.
     */
    limit?: number
  }

  /**
   * AccumulatorBuild without action
   */
  export type AccumulatorBuildDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AccumulatorBuild
     */
    select?: AccumulatorBuildSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AccumulatorBuild
     */
    omit?: AccumulatorBuildOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const FixtureScalarFieldEnum: {
    id: 'id',
    fixtureId: 'fixtureId',
    homeTeam: 'homeTeam',
    awayTeam: 'awayTeam',
    homeTeamId: 'homeTeamId',
    awayTeamId: 'awayTeamId',
    league: 'league',
    leagueId: 'leagueId',
    country: 'country',
    matchDate: 'matchDate',
    status: 'status',
    homeScore: 'homeScore',
    awayScore: 'awayScore',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type FixtureScalarFieldEnum = (typeof FixtureScalarFieldEnum)[keyof typeof FixtureScalarFieldEnum]


  export const MatchStatisticsScalarFieldEnum: {
    id: 'id',
    fixtureId: 'fixtureId',
    homeFormString: 'homeFormString',
    homeWins: 'homeWins',
    homeDraws: 'homeDraws',
    homeLosses: 'homeLosses',
    homeGoalsScored: 'homeGoalsScored',
    homeGoalsConceded: 'homeGoalsConceded',
    homeAvgScored: 'homeAvgScored',
    homeAvgConceded: 'homeAvgConceded',
    awayFormString: 'awayFormString',
    awayWins: 'awayWins',
    awayDraws: 'awayDraws',
    awayLosses: 'awayLosses',
    awayGoalsScored: 'awayGoalsScored',
    awayGoalsConceded: 'awayGoalsConceded',
    awayAvgScored: 'awayAvgScored',
    awayAvgConceded: 'awayAvgConceded',
    probHome: 'probHome',
    probDraw: 'probDraw',
    probAway: 'probAway',
    predictedResult: 'predictedResult',
    over15Rate: 'over15Rate',
    over25Rate: 'over25Rate',
    bttsRate: 'bttsRate',
    xGHome: 'xGHome',
    xGAway: 'xGAway',
    homeInjuredCount: 'homeInjuredCount',
    awayInjuredCount: 'awayInjuredCount',
    oddsHome: 'oddsHome',
    oddsDraw: 'oddsDraw',
    oddsAway: 'oddsAway',
    dataSource: 'dataSource',
    fetchedAt: 'fetchedAt',
    updatedAt: 'updatedAt'
  };

  export type MatchStatisticsScalarFieldEnum = (typeof MatchStatisticsScalarFieldEnum)[keyof typeof MatchStatisticsScalarFieldEnum]


  export const H2HRecordScalarFieldEnum: {
    id: 'id',
    homeTeamId: 'homeTeamId',
    awayTeamId: 'awayTeamId',
    totalMeetings: 'totalMeetings',
    homeWins: 'homeWins',
    awayWins: 'awayWins',
    draws: 'draws',
    totalGoals: 'totalGoals',
    avgGoalsPerGame: 'avgGoalsPerGame',
    homeWinRate: 'homeWinRate',
    awayWinRate: 'awayWinRate',
    drawRate: 'drawRate',
    updatedAt: 'updatedAt'
  };

  export type H2HRecordScalarFieldEnum = (typeof H2HRecordScalarFieldEnum)[keyof typeof H2HRecordScalarFieldEnum]


  export const TeamStrengthScalarFieldEnum: {
    id: 'id',
    teamId: 'teamId',
    teamName: 'teamName',
    leagueId: 'leagueId',
    attackStrength: 'attackStrength',
    defenceStrength: 'defenceStrength',
    overallStrength: 'overallStrength',
    homeStrength: 'homeStrength',
    awayStrength: 'awayStrength',
    formPoints: 'formPoints',
    formString: 'formString',
    gamesPlayed: 'gamesPlayed',
    updatedAt: 'updatedAt'
  };

  export type TeamStrengthScalarFieldEnum = (typeof TeamStrengthScalarFieldEnum)[keyof typeof TeamStrengthScalarFieldEnum]


  export const ConfidenceScoreScalarFieldEnum: {
    id: 'id',
    fixtureId: 'fixtureId',
    pick: 'pick',
    market: 'market',
    formScore: 'formScore',
    homeAwayScore: 'homeAwayScore',
    h2hScore: 'h2hScore',
    goalTrendScore: 'goalTrendScore',
    oddsScore: 'oddsScore',
    teamStrengthScore: 'teamStrengthScore',
    grooveScore: 'grooveScore',
    riskLevel: 'riskLevel',
    confidence: 'confidence',
    impliedProbability: 'impliedProbability',
    realProbability: 'realProbability',
    valueEdge: 'valueEdge',
    calculatedAt: 'calculatedAt'
  };

  export type ConfidenceScoreScalarFieldEnum = (typeof ConfidenceScoreScalarFieldEnum)[keyof typeof ConfidenceScoreScalarFieldEnum]


  export const MarketRuleScalarFieldEnum: {
    id: 'id',
    marketKey: 'marketKey',
    marketName: 'marketName',
    marketGroup: 'marketGroup',
    riskCategory: 'riskCategory',
    minConfidence: 'minConfidence',
    keepThreshold: 'keepThreshold',
    replaceThreshold: 'replaceThreshold',
    removeThreshold: 'removeThreshold',
    requiredMetrics: 'requiredMetrics',
    formWeight: 'formWeight',
    homeAwayWeight: 'homeAwayWeight',
    h2hWeight: 'h2hWeight',
    goalTrendWeight: 'goalTrendWeight',
    oddsWeight: 'oddsWeight',
    teamStrengthWeight: 'teamStrengthWeight',
    correlationGroup: 'correlationGroup',
    safeAlternative: 'safeAlternative',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type MarketRuleScalarFieldEnum = (typeof MarketRuleScalarFieldEnum)[keyof typeof MarketRuleScalarFieldEnum]


  export const ValueBetScanScalarFieldEnum: {
    id: 'id',
    fixtureId: 'fixtureId',
    pick: 'pick',
    market: 'market',
    odds: 'odds',
    grooveScore: 'grooveScore',
    realProbability: 'realProbability',
    impliedProbability: 'impliedProbability',
    valueEdge: 'valueEdge',
    confidence: 'confidence',
    reason: 'reason',
    scanDate: 'scanDate',
    isActive: 'isActive'
  };

  export type ValueBetScanScalarFieldEnum = (typeof ValueBetScanScalarFieldEnum)[keyof typeof ValueBetScanScalarFieldEnum]


  export const SlipAnalysisLogScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    slipId: 'slipId',
    totalGames: 'totalGames',
    keptGames: 'keptGames',
    removedGames: 'removedGames',
    replacedGames: 'replacedGames',
    originalOdds: 'originalOdds',
    newOdds: 'newOdds',
    targetOdds: 'targetOdds',
    allowSwitching: 'allowSwitching',
    avgGrooveScore: 'avgGrooveScore',
    analysedAt: 'analysedAt'
  };

  export type SlipAnalysisLogScalarFieldEnum = (typeof SlipAnalysisLogScalarFieldEnum)[keyof typeof SlipAnalysisLogScalarFieldEnum]


  export const AccumulatorBuildScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    targetOdds: 'targetOdds',
    actualOdds: 'actualOdds',
    riskLevel: 'riskLevel',
    legsCount: 'legsCount',
    avgGrooveScore: 'avgGrooveScore',
    picks: 'picks',
    builtAt: 'builtAt'
  };

  export type AccumulatorBuildScalarFieldEnum = (typeof AccumulatorBuildScalarFieldEnum)[keyof typeof AccumulatorBuildScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'FixtureStatus'
   */
  export type EnumFixtureStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'FixtureStatus'>
    


  /**
   * Reference to a field of type 'FixtureStatus[]'
   */
  export type ListEnumFixtureStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'FixtureStatus[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'RiskLevel'
   */
  export type EnumRiskLevelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RiskLevel'>
    


  /**
   * Reference to a field of type 'RiskLevel[]'
   */
  export type ListEnumRiskLevelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RiskLevel[]'>
    


  /**
   * Reference to a field of type 'MarketRisk'
   */
  export type EnumMarketRiskFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MarketRisk'>
    


  /**
   * Reference to a field of type 'MarketRisk[]'
   */
  export type ListEnumMarketRiskFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MarketRisk[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    
  /**
   * Deep Input Types
   */


  export type FixtureWhereInput = {
    AND?: FixtureWhereInput | FixtureWhereInput[]
    OR?: FixtureWhereInput[]
    NOT?: FixtureWhereInput | FixtureWhereInput[]
    id?: StringFilter<"Fixture"> | string
    fixtureId?: StringFilter<"Fixture"> | string
    homeTeam?: StringFilter<"Fixture"> | string
    awayTeam?: StringFilter<"Fixture"> | string
    homeTeamId?: StringFilter<"Fixture"> | string
    awayTeamId?: StringFilter<"Fixture"> | string
    league?: StringFilter<"Fixture"> | string
    leagueId?: StringFilter<"Fixture"> | string
    country?: StringFilter<"Fixture"> | string
    matchDate?: DateTimeFilter<"Fixture"> | Date | string
    status?: EnumFixtureStatusFilter<"Fixture"> | $Enums.FixtureStatus
    homeScore?: IntNullableFilter<"Fixture"> | number | null
    awayScore?: IntNullableFilter<"Fixture"> | number | null
    createdAt?: DateTimeFilter<"Fixture"> | Date | string
    updatedAt?: DateTimeFilter<"Fixture"> | Date | string
    statistics?: XOR<MatchStatisticsNullableScalarRelationFilter, MatchStatisticsWhereInput> | null
    confidenceScores?: ConfidenceScoreListRelationFilter
    valueBetScans?: ValueBetScanListRelationFilter
  }

  export type FixtureOrderByWithRelationInput = {
    id?: SortOrder
    fixtureId?: SortOrder
    homeTeam?: SortOrder
    awayTeam?: SortOrder
    homeTeamId?: SortOrder
    awayTeamId?: SortOrder
    league?: SortOrder
    leagueId?: SortOrder
    country?: SortOrder
    matchDate?: SortOrder
    status?: SortOrder
    homeScore?: SortOrderInput | SortOrder
    awayScore?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    statistics?: MatchStatisticsOrderByWithRelationInput
    confidenceScores?: ConfidenceScoreOrderByRelationAggregateInput
    valueBetScans?: ValueBetScanOrderByRelationAggregateInput
  }

  export type FixtureWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    fixtureId?: string
    AND?: FixtureWhereInput | FixtureWhereInput[]
    OR?: FixtureWhereInput[]
    NOT?: FixtureWhereInput | FixtureWhereInput[]
    homeTeam?: StringFilter<"Fixture"> | string
    awayTeam?: StringFilter<"Fixture"> | string
    homeTeamId?: StringFilter<"Fixture"> | string
    awayTeamId?: StringFilter<"Fixture"> | string
    league?: StringFilter<"Fixture"> | string
    leagueId?: StringFilter<"Fixture"> | string
    country?: StringFilter<"Fixture"> | string
    matchDate?: DateTimeFilter<"Fixture"> | Date | string
    status?: EnumFixtureStatusFilter<"Fixture"> | $Enums.FixtureStatus
    homeScore?: IntNullableFilter<"Fixture"> | number | null
    awayScore?: IntNullableFilter<"Fixture"> | number | null
    createdAt?: DateTimeFilter<"Fixture"> | Date | string
    updatedAt?: DateTimeFilter<"Fixture"> | Date | string
    statistics?: XOR<MatchStatisticsNullableScalarRelationFilter, MatchStatisticsWhereInput> | null
    confidenceScores?: ConfidenceScoreListRelationFilter
    valueBetScans?: ValueBetScanListRelationFilter
  }, "id" | "fixtureId">

  export type FixtureOrderByWithAggregationInput = {
    id?: SortOrder
    fixtureId?: SortOrder
    homeTeam?: SortOrder
    awayTeam?: SortOrder
    homeTeamId?: SortOrder
    awayTeamId?: SortOrder
    league?: SortOrder
    leagueId?: SortOrder
    country?: SortOrder
    matchDate?: SortOrder
    status?: SortOrder
    homeScore?: SortOrderInput | SortOrder
    awayScore?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: FixtureCountOrderByAggregateInput
    _avg?: FixtureAvgOrderByAggregateInput
    _max?: FixtureMaxOrderByAggregateInput
    _min?: FixtureMinOrderByAggregateInput
    _sum?: FixtureSumOrderByAggregateInput
  }

  export type FixtureScalarWhereWithAggregatesInput = {
    AND?: FixtureScalarWhereWithAggregatesInput | FixtureScalarWhereWithAggregatesInput[]
    OR?: FixtureScalarWhereWithAggregatesInput[]
    NOT?: FixtureScalarWhereWithAggregatesInput | FixtureScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Fixture"> | string
    fixtureId?: StringWithAggregatesFilter<"Fixture"> | string
    homeTeam?: StringWithAggregatesFilter<"Fixture"> | string
    awayTeam?: StringWithAggregatesFilter<"Fixture"> | string
    homeTeamId?: StringWithAggregatesFilter<"Fixture"> | string
    awayTeamId?: StringWithAggregatesFilter<"Fixture"> | string
    league?: StringWithAggregatesFilter<"Fixture"> | string
    leagueId?: StringWithAggregatesFilter<"Fixture"> | string
    country?: StringWithAggregatesFilter<"Fixture"> | string
    matchDate?: DateTimeWithAggregatesFilter<"Fixture"> | Date | string
    status?: EnumFixtureStatusWithAggregatesFilter<"Fixture"> | $Enums.FixtureStatus
    homeScore?: IntNullableWithAggregatesFilter<"Fixture"> | number | null
    awayScore?: IntNullableWithAggregatesFilter<"Fixture"> | number | null
    createdAt?: DateTimeWithAggregatesFilter<"Fixture"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Fixture"> | Date | string
  }

  export type MatchStatisticsWhereInput = {
    AND?: MatchStatisticsWhereInput | MatchStatisticsWhereInput[]
    OR?: MatchStatisticsWhereInput[]
    NOT?: MatchStatisticsWhereInput | MatchStatisticsWhereInput[]
    id?: StringFilter<"MatchStatistics"> | string
    fixtureId?: StringFilter<"MatchStatistics"> | string
    homeFormString?: StringNullableFilter<"MatchStatistics"> | string | null
    homeWins?: IntFilter<"MatchStatistics"> | number
    homeDraws?: IntFilter<"MatchStatistics"> | number
    homeLosses?: IntFilter<"MatchStatistics"> | number
    homeGoalsScored?: IntFilter<"MatchStatistics"> | number
    homeGoalsConceded?: IntFilter<"MatchStatistics"> | number
    homeAvgScored?: FloatFilter<"MatchStatistics"> | number
    homeAvgConceded?: FloatFilter<"MatchStatistics"> | number
    awayFormString?: StringNullableFilter<"MatchStatistics"> | string | null
    awayWins?: IntFilter<"MatchStatistics"> | number
    awayDraws?: IntFilter<"MatchStatistics"> | number
    awayLosses?: IntFilter<"MatchStatistics"> | number
    awayGoalsScored?: IntFilter<"MatchStatistics"> | number
    awayGoalsConceded?: IntFilter<"MatchStatistics"> | number
    awayAvgScored?: FloatFilter<"MatchStatistics"> | number
    awayAvgConceded?: FloatFilter<"MatchStatistics"> | number
    probHome?: FloatFilter<"MatchStatistics"> | number
    probDraw?: FloatFilter<"MatchStatistics"> | number
    probAway?: FloatFilter<"MatchStatistics"> | number
    predictedResult?: StringNullableFilter<"MatchStatistics"> | string | null
    over15Rate?: FloatFilter<"MatchStatistics"> | number
    over25Rate?: FloatFilter<"MatchStatistics"> | number
    bttsRate?: FloatFilter<"MatchStatistics"> | number
    xGHome?: FloatNullableFilter<"MatchStatistics"> | number | null
    xGAway?: FloatNullableFilter<"MatchStatistics"> | number | null
    homeInjuredCount?: IntFilter<"MatchStatistics"> | number
    awayInjuredCount?: IntFilter<"MatchStatistics"> | number
    oddsHome?: FloatNullableFilter<"MatchStatistics"> | number | null
    oddsDraw?: FloatNullableFilter<"MatchStatistics"> | number | null
    oddsAway?: FloatNullableFilter<"MatchStatistics"> | number | null
    dataSource?: StringFilter<"MatchStatistics"> | string
    fetchedAt?: DateTimeFilter<"MatchStatistics"> | Date | string
    updatedAt?: DateTimeFilter<"MatchStatistics"> | Date | string
    fixture?: XOR<FixtureScalarRelationFilter, FixtureWhereInput>
  }

  export type MatchStatisticsOrderByWithRelationInput = {
    id?: SortOrder
    fixtureId?: SortOrder
    homeFormString?: SortOrderInput | SortOrder
    homeWins?: SortOrder
    homeDraws?: SortOrder
    homeLosses?: SortOrder
    homeGoalsScored?: SortOrder
    homeGoalsConceded?: SortOrder
    homeAvgScored?: SortOrder
    homeAvgConceded?: SortOrder
    awayFormString?: SortOrderInput | SortOrder
    awayWins?: SortOrder
    awayDraws?: SortOrder
    awayLosses?: SortOrder
    awayGoalsScored?: SortOrder
    awayGoalsConceded?: SortOrder
    awayAvgScored?: SortOrder
    awayAvgConceded?: SortOrder
    probHome?: SortOrder
    probDraw?: SortOrder
    probAway?: SortOrder
    predictedResult?: SortOrderInput | SortOrder
    over15Rate?: SortOrder
    over25Rate?: SortOrder
    bttsRate?: SortOrder
    xGHome?: SortOrderInput | SortOrder
    xGAway?: SortOrderInput | SortOrder
    homeInjuredCount?: SortOrder
    awayInjuredCount?: SortOrder
    oddsHome?: SortOrderInput | SortOrder
    oddsDraw?: SortOrderInput | SortOrder
    oddsAway?: SortOrderInput | SortOrder
    dataSource?: SortOrder
    fetchedAt?: SortOrder
    updatedAt?: SortOrder
    fixture?: FixtureOrderByWithRelationInput
  }

  export type MatchStatisticsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    fixtureId?: string
    AND?: MatchStatisticsWhereInput | MatchStatisticsWhereInput[]
    OR?: MatchStatisticsWhereInput[]
    NOT?: MatchStatisticsWhereInput | MatchStatisticsWhereInput[]
    homeFormString?: StringNullableFilter<"MatchStatistics"> | string | null
    homeWins?: IntFilter<"MatchStatistics"> | number
    homeDraws?: IntFilter<"MatchStatistics"> | number
    homeLosses?: IntFilter<"MatchStatistics"> | number
    homeGoalsScored?: IntFilter<"MatchStatistics"> | number
    homeGoalsConceded?: IntFilter<"MatchStatistics"> | number
    homeAvgScored?: FloatFilter<"MatchStatistics"> | number
    homeAvgConceded?: FloatFilter<"MatchStatistics"> | number
    awayFormString?: StringNullableFilter<"MatchStatistics"> | string | null
    awayWins?: IntFilter<"MatchStatistics"> | number
    awayDraws?: IntFilter<"MatchStatistics"> | number
    awayLosses?: IntFilter<"MatchStatistics"> | number
    awayGoalsScored?: IntFilter<"MatchStatistics"> | number
    awayGoalsConceded?: IntFilter<"MatchStatistics"> | number
    awayAvgScored?: FloatFilter<"MatchStatistics"> | number
    awayAvgConceded?: FloatFilter<"MatchStatistics"> | number
    probHome?: FloatFilter<"MatchStatistics"> | number
    probDraw?: FloatFilter<"MatchStatistics"> | number
    probAway?: FloatFilter<"MatchStatistics"> | number
    predictedResult?: StringNullableFilter<"MatchStatistics"> | string | null
    over15Rate?: FloatFilter<"MatchStatistics"> | number
    over25Rate?: FloatFilter<"MatchStatistics"> | number
    bttsRate?: FloatFilter<"MatchStatistics"> | number
    xGHome?: FloatNullableFilter<"MatchStatistics"> | number | null
    xGAway?: FloatNullableFilter<"MatchStatistics"> | number | null
    homeInjuredCount?: IntFilter<"MatchStatistics"> | number
    awayInjuredCount?: IntFilter<"MatchStatistics"> | number
    oddsHome?: FloatNullableFilter<"MatchStatistics"> | number | null
    oddsDraw?: FloatNullableFilter<"MatchStatistics"> | number | null
    oddsAway?: FloatNullableFilter<"MatchStatistics"> | number | null
    dataSource?: StringFilter<"MatchStatistics"> | string
    fetchedAt?: DateTimeFilter<"MatchStatistics"> | Date | string
    updatedAt?: DateTimeFilter<"MatchStatistics"> | Date | string
    fixture?: XOR<FixtureScalarRelationFilter, FixtureWhereInput>
  }, "id" | "fixtureId">

  export type MatchStatisticsOrderByWithAggregationInput = {
    id?: SortOrder
    fixtureId?: SortOrder
    homeFormString?: SortOrderInput | SortOrder
    homeWins?: SortOrder
    homeDraws?: SortOrder
    homeLosses?: SortOrder
    homeGoalsScored?: SortOrder
    homeGoalsConceded?: SortOrder
    homeAvgScored?: SortOrder
    homeAvgConceded?: SortOrder
    awayFormString?: SortOrderInput | SortOrder
    awayWins?: SortOrder
    awayDraws?: SortOrder
    awayLosses?: SortOrder
    awayGoalsScored?: SortOrder
    awayGoalsConceded?: SortOrder
    awayAvgScored?: SortOrder
    awayAvgConceded?: SortOrder
    probHome?: SortOrder
    probDraw?: SortOrder
    probAway?: SortOrder
    predictedResult?: SortOrderInput | SortOrder
    over15Rate?: SortOrder
    over25Rate?: SortOrder
    bttsRate?: SortOrder
    xGHome?: SortOrderInput | SortOrder
    xGAway?: SortOrderInput | SortOrder
    homeInjuredCount?: SortOrder
    awayInjuredCount?: SortOrder
    oddsHome?: SortOrderInput | SortOrder
    oddsDraw?: SortOrderInput | SortOrder
    oddsAway?: SortOrderInput | SortOrder
    dataSource?: SortOrder
    fetchedAt?: SortOrder
    updatedAt?: SortOrder
    _count?: MatchStatisticsCountOrderByAggregateInput
    _avg?: MatchStatisticsAvgOrderByAggregateInput
    _max?: MatchStatisticsMaxOrderByAggregateInput
    _min?: MatchStatisticsMinOrderByAggregateInput
    _sum?: MatchStatisticsSumOrderByAggregateInput
  }

  export type MatchStatisticsScalarWhereWithAggregatesInput = {
    AND?: MatchStatisticsScalarWhereWithAggregatesInput | MatchStatisticsScalarWhereWithAggregatesInput[]
    OR?: MatchStatisticsScalarWhereWithAggregatesInput[]
    NOT?: MatchStatisticsScalarWhereWithAggregatesInput | MatchStatisticsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"MatchStatistics"> | string
    fixtureId?: StringWithAggregatesFilter<"MatchStatistics"> | string
    homeFormString?: StringNullableWithAggregatesFilter<"MatchStatistics"> | string | null
    homeWins?: IntWithAggregatesFilter<"MatchStatistics"> | number
    homeDraws?: IntWithAggregatesFilter<"MatchStatistics"> | number
    homeLosses?: IntWithAggregatesFilter<"MatchStatistics"> | number
    homeGoalsScored?: IntWithAggregatesFilter<"MatchStatistics"> | number
    homeGoalsConceded?: IntWithAggregatesFilter<"MatchStatistics"> | number
    homeAvgScored?: FloatWithAggregatesFilter<"MatchStatistics"> | number
    homeAvgConceded?: FloatWithAggregatesFilter<"MatchStatistics"> | number
    awayFormString?: StringNullableWithAggregatesFilter<"MatchStatistics"> | string | null
    awayWins?: IntWithAggregatesFilter<"MatchStatistics"> | number
    awayDraws?: IntWithAggregatesFilter<"MatchStatistics"> | number
    awayLosses?: IntWithAggregatesFilter<"MatchStatistics"> | number
    awayGoalsScored?: IntWithAggregatesFilter<"MatchStatistics"> | number
    awayGoalsConceded?: IntWithAggregatesFilter<"MatchStatistics"> | number
    awayAvgScored?: FloatWithAggregatesFilter<"MatchStatistics"> | number
    awayAvgConceded?: FloatWithAggregatesFilter<"MatchStatistics"> | number
    probHome?: FloatWithAggregatesFilter<"MatchStatistics"> | number
    probDraw?: FloatWithAggregatesFilter<"MatchStatistics"> | number
    probAway?: FloatWithAggregatesFilter<"MatchStatistics"> | number
    predictedResult?: StringNullableWithAggregatesFilter<"MatchStatistics"> | string | null
    over15Rate?: FloatWithAggregatesFilter<"MatchStatistics"> | number
    over25Rate?: FloatWithAggregatesFilter<"MatchStatistics"> | number
    bttsRate?: FloatWithAggregatesFilter<"MatchStatistics"> | number
    xGHome?: FloatNullableWithAggregatesFilter<"MatchStatistics"> | number | null
    xGAway?: FloatNullableWithAggregatesFilter<"MatchStatistics"> | number | null
    homeInjuredCount?: IntWithAggregatesFilter<"MatchStatistics"> | number
    awayInjuredCount?: IntWithAggregatesFilter<"MatchStatistics"> | number
    oddsHome?: FloatNullableWithAggregatesFilter<"MatchStatistics"> | number | null
    oddsDraw?: FloatNullableWithAggregatesFilter<"MatchStatistics"> | number | null
    oddsAway?: FloatNullableWithAggregatesFilter<"MatchStatistics"> | number | null
    dataSource?: StringWithAggregatesFilter<"MatchStatistics"> | string
    fetchedAt?: DateTimeWithAggregatesFilter<"MatchStatistics"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"MatchStatistics"> | Date | string
  }

  export type H2HRecordWhereInput = {
    AND?: H2HRecordWhereInput | H2HRecordWhereInput[]
    OR?: H2HRecordWhereInput[]
    NOT?: H2HRecordWhereInput | H2HRecordWhereInput[]
    id?: StringFilter<"H2HRecord"> | string
    homeTeamId?: StringFilter<"H2HRecord"> | string
    awayTeamId?: StringFilter<"H2HRecord"> | string
    totalMeetings?: IntFilter<"H2HRecord"> | number
    homeWins?: IntFilter<"H2HRecord"> | number
    awayWins?: IntFilter<"H2HRecord"> | number
    draws?: IntFilter<"H2HRecord"> | number
    totalGoals?: IntFilter<"H2HRecord"> | number
    avgGoalsPerGame?: FloatFilter<"H2HRecord"> | number
    homeWinRate?: FloatFilter<"H2HRecord"> | number
    awayWinRate?: FloatFilter<"H2HRecord"> | number
    drawRate?: FloatFilter<"H2HRecord"> | number
    updatedAt?: DateTimeFilter<"H2HRecord"> | Date | string
  }

  export type H2HRecordOrderByWithRelationInput = {
    id?: SortOrder
    homeTeamId?: SortOrder
    awayTeamId?: SortOrder
    totalMeetings?: SortOrder
    homeWins?: SortOrder
    awayWins?: SortOrder
    draws?: SortOrder
    totalGoals?: SortOrder
    avgGoalsPerGame?: SortOrder
    homeWinRate?: SortOrder
    awayWinRate?: SortOrder
    drawRate?: SortOrder
    updatedAt?: SortOrder
  }

  export type H2HRecordWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    homeTeamId_awayTeamId?: H2HRecordHomeTeamIdAwayTeamIdCompoundUniqueInput
    AND?: H2HRecordWhereInput | H2HRecordWhereInput[]
    OR?: H2HRecordWhereInput[]
    NOT?: H2HRecordWhereInput | H2HRecordWhereInput[]
    homeTeamId?: StringFilter<"H2HRecord"> | string
    awayTeamId?: StringFilter<"H2HRecord"> | string
    totalMeetings?: IntFilter<"H2HRecord"> | number
    homeWins?: IntFilter<"H2HRecord"> | number
    awayWins?: IntFilter<"H2HRecord"> | number
    draws?: IntFilter<"H2HRecord"> | number
    totalGoals?: IntFilter<"H2HRecord"> | number
    avgGoalsPerGame?: FloatFilter<"H2HRecord"> | number
    homeWinRate?: FloatFilter<"H2HRecord"> | number
    awayWinRate?: FloatFilter<"H2HRecord"> | number
    drawRate?: FloatFilter<"H2HRecord"> | number
    updatedAt?: DateTimeFilter<"H2HRecord"> | Date | string
  }, "id" | "homeTeamId_awayTeamId">

  export type H2HRecordOrderByWithAggregationInput = {
    id?: SortOrder
    homeTeamId?: SortOrder
    awayTeamId?: SortOrder
    totalMeetings?: SortOrder
    homeWins?: SortOrder
    awayWins?: SortOrder
    draws?: SortOrder
    totalGoals?: SortOrder
    avgGoalsPerGame?: SortOrder
    homeWinRate?: SortOrder
    awayWinRate?: SortOrder
    drawRate?: SortOrder
    updatedAt?: SortOrder
    _count?: H2HRecordCountOrderByAggregateInput
    _avg?: H2HRecordAvgOrderByAggregateInput
    _max?: H2HRecordMaxOrderByAggregateInput
    _min?: H2HRecordMinOrderByAggregateInput
    _sum?: H2HRecordSumOrderByAggregateInput
  }

  export type H2HRecordScalarWhereWithAggregatesInput = {
    AND?: H2HRecordScalarWhereWithAggregatesInput | H2HRecordScalarWhereWithAggregatesInput[]
    OR?: H2HRecordScalarWhereWithAggregatesInput[]
    NOT?: H2HRecordScalarWhereWithAggregatesInput | H2HRecordScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"H2HRecord"> | string
    homeTeamId?: StringWithAggregatesFilter<"H2HRecord"> | string
    awayTeamId?: StringWithAggregatesFilter<"H2HRecord"> | string
    totalMeetings?: IntWithAggregatesFilter<"H2HRecord"> | number
    homeWins?: IntWithAggregatesFilter<"H2HRecord"> | number
    awayWins?: IntWithAggregatesFilter<"H2HRecord"> | number
    draws?: IntWithAggregatesFilter<"H2HRecord"> | number
    totalGoals?: IntWithAggregatesFilter<"H2HRecord"> | number
    avgGoalsPerGame?: FloatWithAggregatesFilter<"H2HRecord"> | number
    homeWinRate?: FloatWithAggregatesFilter<"H2HRecord"> | number
    awayWinRate?: FloatWithAggregatesFilter<"H2HRecord"> | number
    drawRate?: FloatWithAggregatesFilter<"H2HRecord"> | number
    updatedAt?: DateTimeWithAggregatesFilter<"H2HRecord"> | Date | string
  }

  export type TeamStrengthWhereInput = {
    AND?: TeamStrengthWhereInput | TeamStrengthWhereInput[]
    OR?: TeamStrengthWhereInput[]
    NOT?: TeamStrengthWhereInput | TeamStrengthWhereInput[]
    id?: StringFilter<"TeamStrength"> | string
    teamId?: StringFilter<"TeamStrength"> | string
    teamName?: StringFilter<"TeamStrength"> | string
    leagueId?: StringFilter<"TeamStrength"> | string
    attackStrength?: FloatFilter<"TeamStrength"> | number
    defenceStrength?: FloatFilter<"TeamStrength"> | number
    overallStrength?: FloatFilter<"TeamStrength"> | number
    homeStrength?: FloatFilter<"TeamStrength"> | number
    awayStrength?: FloatFilter<"TeamStrength"> | number
    formPoints?: IntFilter<"TeamStrength"> | number
    formString?: StringNullableFilter<"TeamStrength"> | string | null
    gamesPlayed?: IntFilter<"TeamStrength"> | number
    updatedAt?: DateTimeFilter<"TeamStrength"> | Date | string
  }

  export type TeamStrengthOrderByWithRelationInput = {
    id?: SortOrder
    teamId?: SortOrder
    teamName?: SortOrder
    leagueId?: SortOrder
    attackStrength?: SortOrder
    defenceStrength?: SortOrder
    overallStrength?: SortOrder
    homeStrength?: SortOrder
    awayStrength?: SortOrder
    formPoints?: SortOrder
    formString?: SortOrderInput | SortOrder
    gamesPlayed?: SortOrder
    updatedAt?: SortOrder
  }

  export type TeamStrengthWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    teamId?: string
    AND?: TeamStrengthWhereInput | TeamStrengthWhereInput[]
    OR?: TeamStrengthWhereInput[]
    NOT?: TeamStrengthWhereInput | TeamStrengthWhereInput[]
    teamName?: StringFilter<"TeamStrength"> | string
    leagueId?: StringFilter<"TeamStrength"> | string
    attackStrength?: FloatFilter<"TeamStrength"> | number
    defenceStrength?: FloatFilter<"TeamStrength"> | number
    overallStrength?: FloatFilter<"TeamStrength"> | number
    homeStrength?: FloatFilter<"TeamStrength"> | number
    awayStrength?: FloatFilter<"TeamStrength"> | number
    formPoints?: IntFilter<"TeamStrength"> | number
    formString?: StringNullableFilter<"TeamStrength"> | string | null
    gamesPlayed?: IntFilter<"TeamStrength"> | number
    updatedAt?: DateTimeFilter<"TeamStrength"> | Date | string
  }, "id" | "teamId">

  export type TeamStrengthOrderByWithAggregationInput = {
    id?: SortOrder
    teamId?: SortOrder
    teamName?: SortOrder
    leagueId?: SortOrder
    attackStrength?: SortOrder
    defenceStrength?: SortOrder
    overallStrength?: SortOrder
    homeStrength?: SortOrder
    awayStrength?: SortOrder
    formPoints?: SortOrder
    formString?: SortOrderInput | SortOrder
    gamesPlayed?: SortOrder
    updatedAt?: SortOrder
    _count?: TeamStrengthCountOrderByAggregateInput
    _avg?: TeamStrengthAvgOrderByAggregateInput
    _max?: TeamStrengthMaxOrderByAggregateInput
    _min?: TeamStrengthMinOrderByAggregateInput
    _sum?: TeamStrengthSumOrderByAggregateInput
  }

  export type TeamStrengthScalarWhereWithAggregatesInput = {
    AND?: TeamStrengthScalarWhereWithAggregatesInput | TeamStrengthScalarWhereWithAggregatesInput[]
    OR?: TeamStrengthScalarWhereWithAggregatesInput[]
    NOT?: TeamStrengthScalarWhereWithAggregatesInput | TeamStrengthScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TeamStrength"> | string
    teamId?: StringWithAggregatesFilter<"TeamStrength"> | string
    teamName?: StringWithAggregatesFilter<"TeamStrength"> | string
    leagueId?: StringWithAggregatesFilter<"TeamStrength"> | string
    attackStrength?: FloatWithAggregatesFilter<"TeamStrength"> | number
    defenceStrength?: FloatWithAggregatesFilter<"TeamStrength"> | number
    overallStrength?: FloatWithAggregatesFilter<"TeamStrength"> | number
    homeStrength?: FloatWithAggregatesFilter<"TeamStrength"> | number
    awayStrength?: FloatWithAggregatesFilter<"TeamStrength"> | number
    formPoints?: IntWithAggregatesFilter<"TeamStrength"> | number
    formString?: StringNullableWithAggregatesFilter<"TeamStrength"> | string | null
    gamesPlayed?: IntWithAggregatesFilter<"TeamStrength"> | number
    updatedAt?: DateTimeWithAggregatesFilter<"TeamStrength"> | Date | string
  }

  export type ConfidenceScoreWhereInput = {
    AND?: ConfidenceScoreWhereInput | ConfidenceScoreWhereInput[]
    OR?: ConfidenceScoreWhereInput[]
    NOT?: ConfidenceScoreWhereInput | ConfidenceScoreWhereInput[]
    id?: StringFilter<"ConfidenceScore"> | string
    fixtureId?: StringFilter<"ConfidenceScore"> | string
    pick?: StringFilter<"ConfidenceScore"> | string
    market?: StringFilter<"ConfidenceScore"> | string
    formScore?: FloatFilter<"ConfidenceScore"> | number
    homeAwayScore?: FloatFilter<"ConfidenceScore"> | number
    h2hScore?: FloatFilter<"ConfidenceScore"> | number
    goalTrendScore?: FloatFilter<"ConfidenceScore"> | number
    oddsScore?: FloatFilter<"ConfidenceScore"> | number
    teamStrengthScore?: FloatFilter<"ConfidenceScore"> | number
    grooveScore?: FloatFilter<"ConfidenceScore"> | number
    riskLevel?: EnumRiskLevelFilter<"ConfidenceScore"> | $Enums.RiskLevel
    confidence?: IntFilter<"ConfidenceScore"> | number
    impliedProbability?: FloatFilter<"ConfidenceScore"> | number
    realProbability?: FloatFilter<"ConfidenceScore"> | number
    valueEdge?: FloatFilter<"ConfidenceScore"> | number
    calculatedAt?: DateTimeFilter<"ConfidenceScore"> | Date | string
    fixture?: XOR<FixtureScalarRelationFilter, FixtureWhereInput>
  }

  export type ConfidenceScoreOrderByWithRelationInput = {
    id?: SortOrder
    fixtureId?: SortOrder
    pick?: SortOrder
    market?: SortOrder
    formScore?: SortOrder
    homeAwayScore?: SortOrder
    h2hScore?: SortOrder
    goalTrendScore?: SortOrder
    oddsScore?: SortOrder
    teamStrengthScore?: SortOrder
    grooveScore?: SortOrder
    riskLevel?: SortOrder
    confidence?: SortOrder
    impliedProbability?: SortOrder
    realProbability?: SortOrder
    valueEdge?: SortOrder
    calculatedAt?: SortOrder
    fixture?: FixtureOrderByWithRelationInput
  }

  export type ConfidenceScoreWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ConfidenceScoreWhereInput | ConfidenceScoreWhereInput[]
    OR?: ConfidenceScoreWhereInput[]
    NOT?: ConfidenceScoreWhereInput | ConfidenceScoreWhereInput[]
    fixtureId?: StringFilter<"ConfidenceScore"> | string
    pick?: StringFilter<"ConfidenceScore"> | string
    market?: StringFilter<"ConfidenceScore"> | string
    formScore?: FloatFilter<"ConfidenceScore"> | number
    homeAwayScore?: FloatFilter<"ConfidenceScore"> | number
    h2hScore?: FloatFilter<"ConfidenceScore"> | number
    goalTrendScore?: FloatFilter<"ConfidenceScore"> | number
    oddsScore?: FloatFilter<"ConfidenceScore"> | number
    teamStrengthScore?: FloatFilter<"ConfidenceScore"> | number
    grooveScore?: FloatFilter<"ConfidenceScore"> | number
    riskLevel?: EnumRiskLevelFilter<"ConfidenceScore"> | $Enums.RiskLevel
    confidence?: IntFilter<"ConfidenceScore"> | number
    impliedProbability?: FloatFilter<"ConfidenceScore"> | number
    realProbability?: FloatFilter<"ConfidenceScore"> | number
    valueEdge?: FloatFilter<"ConfidenceScore"> | number
    calculatedAt?: DateTimeFilter<"ConfidenceScore"> | Date | string
    fixture?: XOR<FixtureScalarRelationFilter, FixtureWhereInput>
  }, "id">

  export type ConfidenceScoreOrderByWithAggregationInput = {
    id?: SortOrder
    fixtureId?: SortOrder
    pick?: SortOrder
    market?: SortOrder
    formScore?: SortOrder
    homeAwayScore?: SortOrder
    h2hScore?: SortOrder
    goalTrendScore?: SortOrder
    oddsScore?: SortOrder
    teamStrengthScore?: SortOrder
    grooveScore?: SortOrder
    riskLevel?: SortOrder
    confidence?: SortOrder
    impliedProbability?: SortOrder
    realProbability?: SortOrder
    valueEdge?: SortOrder
    calculatedAt?: SortOrder
    _count?: ConfidenceScoreCountOrderByAggregateInput
    _avg?: ConfidenceScoreAvgOrderByAggregateInput
    _max?: ConfidenceScoreMaxOrderByAggregateInput
    _min?: ConfidenceScoreMinOrderByAggregateInput
    _sum?: ConfidenceScoreSumOrderByAggregateInput
  }

  export type ConfidenceScoreScalarWhereWithAggregatesInput = {
    AND?: ConfidenceScoreScalarWhereWithAggregatesInput | ConfidenceScoreScalarWhereWithAggregatesInput[]
    OR?: ConfidenceScoreScalarWhereWithAggregatesInput[]
    NOT?: ConfidenceScoreScalarWhereWithAggregatesInput | ConfidenceScoreScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ConfidenceScore"> | string
    fixtureId?: StringWithAggregatesFilter<"ConfidenceScore"> | string
    pick?: StringWithAggregatesFilter<"ConfidenceScore"> | string
    market?: StringWithAggregatesFilter<"ConfidenceScore"> | string
    formScore?: FloatWithAggregatesFilter<"ConfidenceScore"> | number
    homeAwayScore?: FloatWithAggregatesFilter<"ConfidenceScore"> | number
    h2hScore?: FloatWithAggregatesFilter<"ConfidenceScore"> | number
    goalTrendScore?: FloatWithAggregatesFilter<"ConfidenceScore"> | number
    oddsScore?: FloatWithAggregatesFilter<"ConfidenceScore"> | number
    teamStrengthScore?: FloatWithAggregatesFilter<"ConfidenceScore"> | number
    grooveScore?: FloatWithAggregatesFilter<"ConfidenceScore"> | number
    riskLevel?: EnumRiskLevelWithAggregatesFilter<"ConfidenceScore"> | $Enums.RiskLevel
    confidence?: IntWithAggregatesFilter<"ConfidenceScore"> | number
    impliedProbability?: FloatWithAggregatesFilter<"ConfidenceScore"> | number
    realProbability?: FloatWithAggregatesFilter<"ConfidenceScore"> | number
    valueEdge?: FloatWithAggregatesFilter<"ConfidenceScore"> | number
    calculatedAt?: DateTimeWithAggregatesFilter<"ConfidenceScore"> | Date | string
  }

  export type MarketRuleWhereInput = {
    AND?: MarketRuleWhereInput | MarketRuleWhereInput[]
    OR?: MarketRuleWhereInput[]
    NOT?: MarketRuleWhereInput | MarketRuleWhereInput[]
    id?: StringFilter<"MarketRule"> | string
    marketKey?: StringFilter<"MarketRule"> | string
    marketName?: StringFilter<"MarketRule"> | string
    marketGroup?: StringFilter<"MarketRule"> | string
    riskCategory?: EnumMarketRiskFilter<"MarketRule"> | $Enums.MarketRisk
    minConfidence?: IntFilter<"MarketRule"> | number
    keepThreshold?: IntFilter<"MarketRule"> | number
    replaceThreshold?: IntFilter<"MarketRule"> | number
    removeThreshold?: IntFilter<"MarketRule"> | number
    requiredMetrics?: JsonFilter<"MarketRule">
    formWeight?: FloatFilter<"MarketRule"> | number
    homeAwayWeight?: FloatFilter<"MarketRule"> | number
    h2hWeight?: FloatFilter<"MarketRule"> | number
    goalTrendWeight?: FloatFilter<"MarketRule"> | number
    oddsWeight?: FloatFilter<"MarketRule"> | number
    teamStrengthWeight?: FloatFilter<"MarketRule"> | number
    correlationGroup?: StringNullableFilter<"MarketRule"> | string | null
    safeAlternative?: StringNullableFilter<"MarketRule"> | string | null
    isActive?: BoolFilter<"MarketRule"> | boolean
    createdAt?: DateTimeFilter<"MarketRule"> | Date | string
    updatedAt?: DateTimeFilter<"MarketRule"> | Date | string
  }

  export type MarketRuleOrderByWithRelationInput = {
    id?: SortOrder
    marketKey?: SortOrder
    marketName?: SortOrder
    marketGroup?: SortOrder
    riskCategory?: SortOrder
    minConfidence?: SortOrder
    keepThreshold?: SortOrder
    replaceThreshold?: SortOrder
    removeThreshold?: SortOrder
    requiredMetrics?: SortOrder
    formWeight?: SortOrder
    homeAwayWeight?: SortOrder
    h2hWeight?: SortOrder
    goalTrendWeight?: SortOrder
    oddsWeight?: SortOrder
    teamStrengthWeight?: SortOrder
    correlationGroup?: SortOrderInput | SortOrder
    safeAlternative?: SortOrderInput | SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MarketRuleWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    marketKey?: string
    AND?: MarketRuleWhereInput | MarketRuleWhereInput[]
    OR?: MarketRuleWhereInput[]
    NOT?: MarketRuleWhereInput | MarketRuleWhereInput[]
    marketName?: StringFilter<"MarketRule"> | string
    marketGroup?: StringFilter<"MarketRule"> | string
    riskCategory?: EnumMarketRiskFilter<"MarketRule"> | $Enums.MarketRisk
    minConfidence?: IntFilter<"MarketRule"> | number
    keepThreshold?: IntFilter<"MarketRule"> | number
    replaceThreshold?: IntFilter<"MarketRule"> | number
    removeThreshold?: IntFilter<"MarketRule"> | number
    requiredMetrics?: JsonFilter<"MarketRule">
    formWeight?: FloatFilter<"MarketRule"> | number
    homeAwayWeight?: FloatFilter<"MarketRule"> | number
    h2hWeight?: FloatFilter<"MarketRule"> | number
    goalTrendWeight?: FloatFilter<"MarketRule"> | number
    oddsWeight?: FloatFilter<"MarketRule"> | number
    teamStrengthWeight?: FloatFilter<"MarketRule"> | number
    correlationGroup?: StringNullableFilter<"MarketRule"> | string | null
    safeAlternative?: StringNullableFilter<"MarketRule"> | string | null
    isActive?: BoolFilter<"MarketRule"> | boolean
    createdAt?: DateTimeFilter<"MarketRule"> | Date | string
    updatedAt?: DateTimeFilter<"MarketRule"> | Date | string
  }, "id" | "marketKey">

  export type MarketRuleOrderByWithAggregationInput = {
    id?: SortOrder
    marketKey?: SortOrder
    marketName?: SortOrder
    marketGroup?: SortOrder
    riskCategory?: SortOrder
    minConfidence?: SortOrder
    keepThreshold?: SortOrder
    replaceThreshold?: SortOrder
    removeThreshold?: SortOrder
    requiredMetrics?: SortOrder
    formWeight?: SortOrder
    homeAwayWeight?: SortOrder
    h2hWeight?: SortOrder
    goalTrendWeight?: SortOrder
    oddsWeight?: SortOrder
    teamStrengthWeight?: SortOrder
    correlationGroup?: SortOrderInput | SortOrder
    safeAlternative?: SortOrderInput | SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: MarketRuleCountOrderByAggregateInput
    _avg?: MarketRuleAvgOrderByAggregateInput
    _max?: MarketRuleMaxOrderByAggregateInput
    _min?: MarketRuleMinOrderByAggregateInput
    _sum?: MarketRuleSumOrderByAggregateInput
  }

  export type MarketRuleScalarWhereWithAggregatesInput = {
    AND?: MarketRuleScalarWhereWithAggregatesInput | MarketRuleScalarWhereWithAggregatesInput[]
    OR?: MarketRuleScalarWhereWithAggregatesInput[]
    NOT?: MarketRuleScalarWhereWithAggregatesInput | MarketRuleScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"MarketRule"> | string
    marketKey?: StringWithAggregatesFilter<"MarketRule"> | string
    marketName?: StringWithAggregatesFilter<"MarketRule"> | string
    marketGroup?: StringWithAggregatesFilter<"MarketRule"> | string
    riskCategory?: EnumMarketRiskWithAggregatesFilter<"MarketRule"> | $Enums.MarketRisk
    minConfidence?: IntWithAggregatesFilter<"MarketRule"> | number
    keepThreshold?: IntWithAggregatesFilter<"MarketRule"> | number
    replaceThreshold?: IntWithAggregatesFilter<"MarketRule"> | number
    removeThreshold?: IntWithAggregatesFilter<"MarketRule"> | number
    requiredMetrics?: JsonWithAggregatesFilter<"MarketRule">
    formWeight?: FloatWithAggregatesFilter<"MarketRule"> | number
    homeAwayWeight?: FloatWithAggregatesFilter<"MarketRule"> | number
    h2hWeight?: FloatWithAggregatesFilter<"MarketRule"> | number
    goalTrendWeight?: FloatWithAggregatesFilter<"MarketRule"> | number
    oddsWeight?: FloatWithAggregatesFilter<"MarketRule"> | number
    teamStrengthWeight?: FloatWithAggregatesFilter<"MarketRule"> | number
    correlationGroup?: StringNullableWithAggregatesFilter<"MarketRule"> | string | null
    safeAlternative?: StringNullableWithAggregatesFilter<"MarketRule"> | string | null
    isActive?: BoolWithAggregatesFilter<"MarketRule"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"MarketRule"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"MarketRule"> | Date | string
  }

  export type ValueBetScanWhereInput = {
    AND?: ValueBetScanWhereInput | ValueBetScanWhereInput[]
    OR?: ValueBetScanWhereInput[]
    NOT?: ValueBetScanWhereInput | ValueBetScanWhereInput[]
    id?: StringFilter<"ValueBetScan"> | string
    fixtureId?: StringFilter<"ValueBetScan"> | string
    pick?: StringFilter<"ValueBetScan"> | string
    market?: StringFilter<"ValueBetScan"> | string
    odds?: FloatFilter<"ValueBetScan"> | number
    grooveScore?: FloatFilter<"ValueBetScan"> | number
    realProbability?: FloatFilter<"ValueBetScan"> | number
    impliedProbability?: FloatFilter<"ValueBetScan"> | number
    valueEdge?: FloatFilter<"ValueBetScan"> | number
    confidence?: IntFilter<"ValueBetScan"> | number
    reason?: StringFilter<"ValueBetScan"> | string
    scanDate?: DateTimeFilter<"ValueBetScan"> | Date | string
    isActive?: BoolFilter<"ValueBetScan"> | boolean
    fixture?: XOR<FixtureScalarRelationFilter, FixtureWhereInput>
  }

  export type ValueBetScanOrderByWithRelationInput = {
    id?: SortOrder
    fixtureId?: SortOrder
    pick?: SortOrder
    market?: SortOrder
    odds?: SortOrder
    grooveScore?: SortOrder
    realProbability?: SortOrder
    impliedProbability?: SortOrder
    valueEdge?: SortOrder
    confidence?: SortOrder
    reason?: SortOrder
    scanDate?: SortOrder
    isActive?: SortOrder
    fixture?: FixtureOrderByWithRelationInput
  }

  export type ValueBetScanWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ValueBetScanWhereInput | ValueBetScanWhereInput[]
    OR?: ValueBetScanWhereInput[]
    NOT?: ValueBetScanWhereInput | ValueBetScanWhereInput[]
    fixtureId?: StringFilter<"ValueBetScan"> | string
    pick?: StringFilter<"ValueBetScan"> | string
    market?: StringFilter<"ValueBetScan"> | string
    odds?: FloatFilter<"ValueBetScan"> | number
    grooveScore?: FloatFilter<"ValueBetScan"> | number
    realProbability?: FloatFilter<"ValueBetScan"> | number
    impliedProbability?: FloatFilter<"ValueBetScan"> | number
    valueEdge?: FloatFilter<"ValueBetScan"> | number
    confidence?: IntFilter<"ValueBetScan"> | number
    reason?: StringFilter<"ValueBetScan"> | string
    scanDate?: DateTimeFilter<"ValueBetScan"> | Date | string
    isActive?: BoolFilter<"ValueBetScan"> | boolean
    fixture?: XOR<FixtureScalarRelationFilter, FixtureWhereInput>
  }, "id">

  export type ValueBetScanOrderByWithAggregationInput = {
    id?: SortOrder
    fixtureId?: SortOrder
    pick?: SortOrder
    market?: SortOrder
    odds?: SortOrder
    grooveScore?: SortOrder
    realProbability?: SortOrder
    impliedProbability?: SortOrder
    valueEdge?: SortOrder
    confidence?: SortOrder
    reason?: SortOrder
    scanDate?: SortOrder
    isActive?: SortOrder
    _count?: ValueBetScanCountOrderByAggregateInput
    _avg?: ValueBetScanAvgOrderByAggregateInput
    _max?: ValueBetScanMaxOrderByAggregateInput
    _min?: ValueBetScanMinOrderByAggregateInput
    _sum?: ValueBetScanSumOrderByAggregateInput
  }

  export type ValueBetScanScalarWhereWithAggregatesInput = {
    AND?: ValueBetScanScalarWhereWithAggregatesInput | ValueBetScanScalarWhereWithAggregatesInput[]
    OR?: ValueBetScanScalarWhereWithAggregatesInput[]
    NOT?: ValueBetScanScalarWhereWithAggregatesInput | ValueBetScanScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ValueBetScan"> | string
    fixtureId?: StringWithAggregatesFilter<"ValueBetScan"> | string
    pick?: StringWithAggregatesFilter<"ValueBetScan"> | string
    market?: StringWithAggregatesFilter<"ValueBetScan"> | string
    odds?: FloatWithAggregatesFilter<"ValueBetScan"> | number
    grooveScore?: FloatWithAggregatesFilter<"ValueBetScan"> | number
    realProbability?: FloatWithAggregatesFilter<"ValueBetScan"> | number
    impliedProbability?: FloatWithAggregatesFilter<"ValueBetScan"> | number
    valueEdge?: FloatWithAggregatesFilter<"ValueBetScan"> | number
    confidence?: IntWithAggregatesFilter<"ValueBetScan"> | number
    reason?: StringWithAggregatesFilter<"ValueBetScan"> | string
    scanDate?: DateTimeWithAggregatesFilter<"ValueBetScan"> | Date | string
    isActive?: BoolWithAggregatesFilter<"ValueBetScan"> | boolean
  }

  export type SlipAnalysisLogWhereInput = {
    AND?: SlipAnalysisLogWhereInput | SlipAnalysisLogWhereInput[]
    OR?: SlipAnalysisLogWhereInput[]
    NOT?: SlipAnalysisLogWhereInput | SlipAnalysisLogWhereInput[]
    id?: StringFilter<"SlipAnalysisLog"> | string
    userId?: StringFilter<"SlipAnalysisLog"> | string
    slipId?: StringNullableFilter<"SlipAnalysisLog"> | string | null
    totalGames?: IntFilter<"SlipAnalysisLog"> | number
    keptGames?: IntFilter<"SlipAnalysisLog"> | number
    removedGames?: IntFilter<"SlipAnalysisLog"> | number
    replacedGames?: IntFilter<"SlipAnalysisLog"> | number
    originalOdds?: FloatFilter<"SlipAnalysisLog"> | number
    newOdds?: FloatFilter<"SlipAnalysisLog"> | number
    targetOdds?: FloatFilter<"SlipAnalysisLog"> | number
    allowSwitching?: BoolFilter<"SlipAnalysisLog"> | boolean
    avgGrooveScore?: FloatFilter<"SlipAnalysisLog"> | number
    analysedAt?: DateTimeFilter<"SlipAnalysisLog"> | Date | string
  }

  export type SlipAnalysisLogOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    slipId?: SortOrderInput | SortOrder
    totalGames?: SortOrder
    keptGames?: SortOrder
    removedGames?: SortOrder
    replacedGames?: SortOrder
    originalOdds?: SortOrder
    newOdds?: SortOrder
    targetOdds?: SortOrder
    allowSwitching?: SortOrder
    avgGrooveScore?: SortOrder
    analysedAt?: SortOrder
  }

  export type SlipAnalysisLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SlipAnalysisLogWhereInput | SlipAnalysisLogWhereInput[]
    OR?: SlipAnalysisLogWhereInput[]
    NOT?: SlipAnalysisLogWhereInput | SlipAnalysisLogWhereInput[]
    userId?: StringFilter<"SlipAnalysisLog"> | string
    slipId?: StringNullableFilter<"SlipAnalysisLog"> | string | null
    totalGames?: IntFilter<"SlipAnalysisLog"> | number
    keptGames?: IntFilter<"SlipAnalysisLog"> | number
    removedGames?: IntFilter<"SlipAnalysisLog"> | number
    replacedGames?: IntFilter<"SlipAnalysisLog"> | number
    originalOdds?: FloatFilter<"SlipAnalysisLog"> | number
    newOdds?: FloatFilter<"SlipAnalysisLog"> | number
    targetOdds?: FloatFilter<"SlipAnalysisLog"> | number
    allowSwitching?: BoolFilter<"SlipAnalysisLog"> | boolean
    avgGrooveScore?: FloatFilter<"SlipAnalysisLog"> | number
    analysedAt?: DateTimeFilter<"SlipAnalysisLog"> | Date | string
  }, "id">

  export type SlipAnalysisLogOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    slipId?: SortOrderInput | SortOrder
    totalGames?: SortOrder
    keptGames?: SortOrder
    removedGames?: SortOrder
    replacedGames?: SortOrder
    originalOdds?: SortOrder
    newOdds?: SortOrder
    targetOdds?: SortOrder
    allowSwitching?: SortOrder
    avgGrooveScore?: SortOrder
    analysedAt?: SortOrder
    _count?: SlipAnalysisLogCountOrderByAggregateInput
    _avg?: SlipAnalysisLogAvgOrderByAggregateInput
    _max?: SlipAnalysisLogMaxOrderByAggregateInput
    _min?: SlipAnalysisLogMinOrderByAggregateInput
    _sum?: SlipAnalysisLogSumOrderByAggregateInput
  }

  export type SlipAnalysisLogScalarWhereWithAggregatesInput = {
    AND?: SlipAnalysisLogScalarWhereWithAggregatesInput | SlipAnalysisLogScalarWhereWithAggregatesInput[]
    OR?: SlipAnalysisLogScalarWhereWithAggregatesInput[]
    NOT?: SlipAnalysisLogScalarWhereWithAggregatesInput | SlipAnalysisLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SlipAnalysisLog"> | string
    userId?: StringWithAggregatesFilter<"SlipAnalysisLog"> | string
    slipId?: StringNullableWithAggregatesFilter<"SlipAnalysisLog"> | string | null
    totalGames?: IntWithAggregatesFilter<"SlipAnalysisLog"> | number
    keptGames?: IntWithAggregatesFilter<"SlipAnalysisLog"> | number
    removedGames?: IntWithAggregatesFilter<"SlipAnalysisLog"> | number
    replacedGames?: IntWithAggregatesFilter<"SlipAnalysisLog"> | number
    originalOdds?: FloatWithAggregatesFilter<"SlipAnalysisLog"> | number
    newOdds?: FloatWithAggregatesFilter<"SlipAnalysisLog"> | number
    targetOdds?: FloatWithAggregatesFilter<"SlipAnalysisLog"> | number
    allowSwitching?: BoolWithAggregatesFilter<"SlipAnalysisLog"> | boolean
    avgGrooveScore?: FloatWithAggregatesFilter<"SlipAnalysisLog"> | number
    analysedAt?: DateTimeWithAggregatesFilter<"SlipAnalysisLog"> | Date | string
  }

  export type AccumulatorBuildWhereInput = {
    AND?: AccumulatorBuildWhereInput | AccumulatorBuildWhereInput[]
    OR?: AccumulatorBuildWhereInput[]
    NOT?: AccumulatorBuildWhereInput | AccumulatorBuildWhereInput[]
    id?: StringFilter<"AccumulatorBuild"> | string
    userId?: StringFilter<"AccumulatorBuild"> | string
    targetOdds?: FloatFilter<"AccumulatorBuild"> | number
    actualOdds?: FloatFilter<"AccumulatorBuild"> | number
    riskLevel?: EnumRiskLevelFilter<"AccumulatorBuild"> | $Enums.RiskLevel
    legsCount?: IntFilter<"AccumulatorBuild"> | number
    avgGrooveScore?: FloatFilter<"AccumulatorBuild"> | number
    picks?: JsonFilter<"AccumulatorBuild">
    builtAt?: DateTimeFilter<"AccumulatorBuild"> | Date | string
  }

  export type AccumulatorBuildOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    targetOdds?: SortOrder
    actualOdds?: SortOrder
    riskLevel?: SortOrder
    legsCount?: SortOrder
    avgGrooveScore?: SortOrder
    picks?: SortOrder
    builtAt?: SortOrder
  }

  export type AccumulatorBuildWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AccumulatorBuildWhereInput | AccumulatorBuildWhereInput[]
    OR?: AccumulatorBuildWhereInput[]
    NOT?: AccumulatorBuildWhereInput | AccumulatorBuildWhereInput[]
    userId?: StringFilter<"AccumulatorBuild"> | string
    targetOdds?: FloatFilter<"AccumulatorBuild"> | number
    actualOdds?: FloatFilter<"AccumulatorBuild"> | number
    riskLevel?: EnumRiskLevelFilter<"AccumulatorBuild"> | $Enums.RiskLevel
    legsCount?: IntFilter<"AccumulatorBuild"> | number
    avgGrooveScore?: FloatFilter<"AccumulatorBuild"> | number
    picks?: JsonFilter<"AccumulatorBuild">
    builtAt?: DateTimeFilter<"AccumulatorBuild"> | Date | string
  }, "id">

  export type AccumulatorBuildOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    targetOdds?: SortOrder
    actualOdds?: SortOrder
    riskLevel?: SortOrder
    legsCount?: SortOrder
    avgGrooveScore?: SortOrder
    picks?: SortOrder
    builtAt?: SortOrder
    _count?: AccumulatorBuildCountOrderByAggregateInput
    _avg?: AccumulatorBuildAvgOrderByAggregateInput
    _max?: AccumulatorBuildMaxOrderByAggregateInput
    _min?: AccumulatorBuildMinOrderByAggregateInput
    _sum?: AccumulatorBuildSumOrderByAggregateInput
  }

  export type AccumulatorBuildScalarWhereWithAggregatesInput = {
    AND?: AccumulatorBuildScalarWhereWithAggregatesInput | AccumulatorBuildScalarWhereWithAggregatesInput[]
    OR?: AccumulatorBuildScalarWhereWithAggregatesInput[]
    NOT?: AccumulatorBuildScalarWhereWithAggregatesInput | AccumulatorBuildScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AccumulatorBuild"> | string
    userId?: StringWithAggregatesFilter<"AccumulatorBuild"> | string
    targetOdds?: FloatWithAggregatesFilter<"AccumulatorBuild"> | number
    actualOdds?: FloatWithAggregatesFilter<"AccumulatorBuild"> | number
    riskLevel?: EnumRiskLevelWithAggregatesFilter<"AccumulatorBuild"> | $Enums.RiskLevel
    legsCount?: IntWithAggregatesFilter<"AccumulatorBuild"> | number
    avgGrooveScore?: FloatWithAggregatesFilter<"AccumulatorBuild"> | number
    picks?: JsonWithAggregatesFilter<"AccumulatorBuild">
    builtAt?: DateTimeWithAggregatesFilter<"AccumulatorBuild"> | Date | string
  }

  export type FixtureCreateInput = {
    id?: string
    fixtureId: string
    homeTeam: string
    awayTeam: string
    homeTeamId: string
    awayTeamId: string
    league: string
    leagueId: string
    country: string
    matchDate: Date | string
    status?: $Enums.FixtureStatus
    homeScore?: number | null
    awayScore?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    statistics?: MatchStatisticsCreateNestedOneWithoutFixtureInput
    confidenceScores?: ConfidenceScoreCreateNestedManyWithoutFixtureInput
    valueBetScans?: ValueBetScanCreateNestedManyWithoutFixtureInput
  }

  export type FixtureUncheckedCreateInput = {
    id?: string
    fixtureId: string
    homeTeam: string
    awayTeam: string
    homeTeamId: string
    awayTeamId: string
    league: string
    leagueId: string
    country: string
    matchDate: Date | string
    status?: $Enums.FixtureStatus
    homeScore?: number | null
    awayScore?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    statistics?: MatchStatisticsUncheckedCreateNestedOneWithoutFixtureInput
    confidenceScores?: ConfidenceScoreUncheckedCreateNestedManyWithoutFixtureInput
    valueBetScans?: ValueBetScanUncheckedCreateNestedManyWithoutFixtureInput
  }

  export type FixtureUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    fixtureId?: StringFieldUpdateOperationsInput | string
    homeTeam?: StringFieldUpdateOperationsInput | string
    awayTeam?: StringFieldUpdateOperationsInput | string
    homeTeamId?: StringFieldUpdateOperationsInput | string
    awayTeamId?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    leagueId?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    matchDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumFixtureStatusFieldUpdateOperationsInput | $Enums.FixtureStatus
    homeScore?: NullableIntFieldUpdateOperationsInput | number | null
    awayScore?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    statistics?: MatchStatisticsUpdateOneWithoutFixtureNestedInput
    confidenceScores?: ConfidenceScoreUpdateManyWithoutFixtureNestedInput
    valueBetScans?: ValueBetScanUpdateManyWithoutFixtureNestedInput
  }

  export type FixtureUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    fixtureId?: StringFieldUpdateOperationsInput | string
    homeTeam?: StringFieldUpdateOperationsInput | string
    awayTeam?: StringFieldUpdateOperationsInput | string
    homeTeamId?: StringFieldUpdateOperationsInput | string
    awayTeamId?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    leagueId?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    matchDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumFixtureStatusFieldUpdateOperationsInput | $Enums.FixtureStatus
    homeScore?: NullableIntFieldUpdateOperationsInput | number | null
    awayScore?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    statistics?: MatchStatisticsUncheckedUpdateOneWithoutFixtureNestedInput
    confidenceScores?: ConfidenceScoreUncheckedUpdateManyWithoutFixtureNestedInput
    valueBetScans?: ValueBetScanUncheckedUpdateManyWithoutFixtureNestedInput
  }

  export type FixtureCreateManyInput = {
    id?: string
    fixtureId: string
    homeTeam: string
    awayTeam: string
    homeTeamId: string
    awayTeamId: string
    league: string
    leagueId: string
    country: string
    matchDate: Date | string
    status?: $Enums.FixtureStatus
    homeScore?: number | null
    awayScore?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FixtureUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    fixtureId?: StringFieldUpdateOperationsInput | string
    homeTeam?: StringFieldUpdateOperationsInput | string
    awayTeam?: StringFieldUpdateOperationsInput | string
    homeTeamId?: StringFieldUpdateOperationsInput | string
    awayTeamId?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    leagueId?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    matchDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumFixtureStatusFieldUpdateOperationsInput | $Enums.FixtureStatus
    homeScore?: NullableIntFieldUpdateOperationsInput | number | null
    awayScore?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FixtureUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    fixtureId?: StringFieldUpdateOperationsInput | string
    homeTeam?: StringFieldUpdateOperationsInput | string
    awayTeam?: StringFieldUpdateOperationsInput | string
    homeTeamId?: StringFieldUpdateOperationsInput | string
    awayTeamId?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    leagueId?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    matchDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumFixtureStatusFieldUpdateOperationsInput | $Enums.FixtureStatus
    homeScore?: NullableIntFieldUpdateOperationsInput | number | null
    awayScore?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MatchStatisticsCreateInput = {
    id?: string
    homeFormString?: string | null
    homeWins?: number
    homeDraws?: number
    homeLosses?: number
    homeGoalsScored?: number
    homeGoalsConceded?: number
    homeAvgScored?: number
    homeAvgConceded?: number
    awayFormString?: string | null
    awayWins?: number
    awayDraws?: number
    awayLosses?: number
    awayGoalsScored?: number
    awayGoalsConceded?: number
    awayAvgScored?: number
    awayAvgConceded?: number
    probHome?: number
    probDraw?: number
    probAway?: number
    predictedResult?: string | null
    over15Rate?: number
    over25Rate?: number
    bttsRate?: number
    xGHome?: number | null
    xGAway?: number | null
    homeInjuredCount?: number
    awayInjuredCount?: number
    oddsHome?: number | null
    oddsDraw?: number | null
    oddsAway?: number | null
    dataSource?: string
    fetchedAt?: Date | string
    updatedAt?: Date | string
    fixture: FixtureCreateNestedOneWithoutStatisticsInput
  }

  export type MatchStatisticsUncheckedCreateInput = {
    id?: string
    fixtureId: string
    homeFormString?: string | null
    homeWins?: number
    homeDraws?: number
    homeLosses?: number
    homeGoalsScored?: number
    homeGoalsConceded?: number
    homeAvgScored?: number
    homeAvgConceded?: number
    awayFormString?: string | null
    awayWins?: number
    awayDraws?: number
    awayLosses?: number
    awayGoalsScored?: number
    awayGoalsConceded?: number
    awayAvgScored?: number
    awayAvgConceded?: number
    probHome?: number
    probDraw?: number
    probAway?: number
    predictedResult?: string | null
    over15Rate?: number
    over25Rate?: number
    bttsRate?: number
    xGHome?: number | null
    xGAway?: number | null
    homeInjuredCount?: number
    awayInjuredCount?: number
    oddsHome?: number | null
    oddsDraw?: number | null
    oddsAway?: number | null
    dataSource?: string
    fetchedAt?: Date | string
    updatedAt?: Date | string
  }

  export type MatchStatisticsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    homeFormString?: NullableStringFieldUpdateOperationsInput | string | null
    homeWins?: IntFieldUpdateOperationsInput | number
    homeDraws?: IntFieldUpdateOperationsInput | number
    homeLosses?: IntFieldUpdateOperationsInput | number
    homeGoalsScored?: IntFieldUpdateOperationsInput | number
    homeGoalsConceded?: IntFieldUpdateOperationsInput | number
    homeAvgScored?: FloatFieldUpdateOperationsInput | number
    homeAvgConceded?: FloatFieldUpdateOperationsInput | number
    awayFormString?: NullableStringFieldUpdateOperationsInput | string | null
    awayWins?: IntFieldUpdateOperationsInput | number
    awayDraws?: IntFieldUpdateOperationsInput | number
    awayLosses?: IntFieldUpdateOperationsInput | number
    awayGoalsScored?: IntFieldUpdateOperationsInput | number
    awayGoalsConceded?: IntFieldUpdateOperationsInput | number
    awayAvgScored?: FloatFieldUpdateOperationsInput | number
    awayAvgConceded?: FloatFieldUpdateOperationsInput | number
    probHome?: FloatFieldUpdateOperationsInput | number
    probDraw?: FloatFieldUpdateOperationsInput | number
    probAway?: FloatFieldUpdateOperationsInput | number
    predictedResult?: NullableStringFieldUpdateOperationsInput | string | null
    over15Rate?: FloatFieldUpdateOperationsInput | number
    over25Rate?: FloatFieldUpdateOperationsInput | number
    bttsRate?: FloatFieldUpdateOperationsInput | number
    xGHome?: NullableFloatFieldUpdateOperationsInput | number | null
    xGAway?: NullableFloatFieldUpdateOperationsInput | number | null
    homeInjuredCount?: IntFieldUpdateOperationsInput | number
    awayInjuredCount?: IntFieldUpdateOperationsInput | number
    oddsHome?: NullableFloatFieldUpdateOperationsInput | number | null
    oddsDraw?: NullableFloatFieldUpdateOperationsInput | number | null
    oddsAway?: NullableFloatFieldUpdateOperationsInput | number | null
    dataSource?: StringFieldUpdateOperationsInput | string
    fetchedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fixture?: FixtureUpdateOneRequiredWithoutStatisticsNestedInput
  }

  export type MatchStatisticsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    fixtureId?: StringFieldUpdateOperationsInput | string
    homeFormString?: NullableStringFieldUpdateOperationsInput | string | null
    homeWins?: IntFieldUpdateOperationsInput | number
    homeDraws?: IntFieldUpdateOperationsInput | number
    homeLosses?: IntFieldUpdateOperationsInput | number
    homeGoalsScored?: IntFieldUpdateOperationsInput | number
    homeGoalsConceded?: IntFieldUpdateOperationsInput | number
    homeAvgScored?: FloatFieldUpdateOperationsInput | number
    homeAvgConceded?: FloatFieldUpdateOperationsInput | number
    awayFormString?: NullableStringFieldUpdateOperationsInput | string | null
    awayWins?: IntFieldUpdateOperationsInput | number
    awayDraws?: IntFieldUpdateOperationsInput | number
    awayLosses?: IntFieldUpdateOperationsInput | number
    awayGoalsScored?: IntFieldUpdateOperationsInput | number
    awayGoalsConceded?: IntFieldUpdateOperationsInput | number
    awayAvgScored?: FloatFieldUpdateOperationsInput | number
    awayAvgConceded?: FloatFieldUpdateOperationsInput | number
    probHome?: FloatFieldUpdateOperationsInput | number
    probDraw?: FloatFieldUpdateOperationsInput | number
    probAway?: FloatFieldUpdateOperationsInput | number
    predictedResult?: NullableStringFieldUpdateOperationsInput | string | null
    over15Rate?: FloatFieldUpdateOperationsInput | number
    over25Rate?: FloatFieldUpdateOperationsInput | number
    bttsRate?: FloatFieldUpdateOperationsInput | number
    xGHome?: NullableFloatFieldUpdateOperationsInput | number | null
    xGAway?: NullableFloatFieldUpdateOperationsInput | number | null
    homeInjuredCount?: IntFieldUpdateOperationsInput | number
    awayInjuredCount?: IntFieldUpdateOperationsInput | number
    oddsHome?: NullableFloatFieldUpdateOperationsInput | number | null
    oddsDraw?: NullableFloatFieldUpdateOperationsInput | number | null
    oddsAway?: NullableFloatFieldUpdateOperationsInput | number | null
    dataSource?: StringFieldUpdateOperationsInput | string
    fetchedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MatchStatisticsCreateManyInput = {
    id?: string
    fixtureId: string
    homeFormString?: string | null
    homeWins?: number
    homeDraws?: number
    homeLosses?: number
    homeGoalsScored?: number
    homeGoalsConceded?: number
    homeAvgScored?: number
    homeAvgConceded?: number
    awayFormString?: string | null
    awayWins?: number
    awayDraws?: number
    awayLosses?: number
    awayGoalsScored?: number
    awayGoalsConceded?: number
    awayAvgScored?: number
    awayAvgConceded?: number
    probHome?: number
    probDraw?: number
    probAway?: number
    predictedResult?: string | null
    over15Rate?: number
    over25Rate?: number
    bttsRate?: number
    xGHome?: number | null
    xGAway?: number | null
    homeInjuredCount?: number
    awayInjuredCount?: number
    oddsHome?: number | null
    oddsDraw?: number | null
    oddsAway?: number | null
    dataSource?: string
    fetchedAt?: Date | string
    updatedAt?: Date | string
  }

  export type MatchStatisticsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    homeFormString?: NullableStringFieldUpdateOperationsInput | string | null
    homeWins?: IntFieldUpdateOperationsInput | number
    homeDraws?: IntFieldUpdateOperationsInput | number
    homeLosses?: IntFieldUpdateOperationsInput | number
    homeGoalsScored?: IntFieldUpdateOperationsInput | number
    homeGoalsConceded?: IntFieldUpdateOperationsInput | number
    homeAvgScored?: FloatFieldUpdateOperationsInput | number
    homeAvgConceded?: FloatFieldUpdateOperationsInput | number
    awayFormString?: NullableStringFieldUpdateOperationsInput | string | null
    awayWins?: IntFieldUpdateOperationsInput | number
    awayDraws?: IntFieldUpdateOperationsInput | number
    awayLosses?: IntFieldUpdateOperationsInput | number
    awayGoalsScored?: IntFieldUpdateOperationsInput | number
    awayGoalsConceded?: IntFieldUpdateOperationsInput | number
    awayAvgScored?: FloatFieldUpdateOperationsInput | number
    awayAvgConceded?: FloatFieldUpdateOperationsInput | number
    probHome?: FloatFieldUpdateOperationsInput | number
    probDraw?: FloatFieldUpdateOperationsInput | number
    probAway?: FloatFieldUpdateOperationsInput | number
    predictedResult?: NullableStringFieldUpdateOperationsInput | string | null
    over15Rate?: FloatFieldUpdateOperationsInput | number
    over25Rate?: FloatFieldUpdateOperationsInput | number
    bttsRate?: FloatFieldUpdateOperationsInput | number
    xGHome?: NullableFloatFieldUpdateOperationsInput | number | null
    xGAway?: NullableFloatFieldUpdateOperationsInput | number | null
    homeInjuredCount?: IntFieldUpdateOperationsInput | number
    awayInjuredCount?: IntFieldUpdateOperationsInput | number
    oddsHome?: NullableFloatFieldUpdateOperationsInput | number | null
    oddsDraw?: NullableFloatFieldUpdateOperationsInput | number | null
    oddsAway?: NullableFloatFieldUpdateOperationsInput | number | null
    dataSource?: StringFieldUpdateOperationsInput | string
    fetchedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MatchStatisticsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    fixtureId?: StringFieldUpdateOperationsInput | string
    homeFormString?: NullableStringFieldUpdateOperationsInput | string | null
    homeWins?: IntFieldUpdateOperationsInput | number
    homeDraws?: IntFieldUpdateOperationsInput | number
    homeLosses?: IntFieldUpdateOperationsInput | number
    homeGoalsScored?: IntFieldUpdateOperationsInput | number
    homeGoalsConceded?: IntFieldUpdateOperationsInput | number
    homeAvgScored?: FloatFieldUpdateOperationsInput | number
    homeAvgConceded?: FloatFieldUpdateOperationsInput | number
    awayFormString?: NullableStringFieldUpdateOperationsInput | string | null
    awayWins?: IntFieldUpdateOperationsInput | number
    awayDraws?: IntFieldUpdateOperationsInput | number
    awayLosses?: IntFieldUpdateOperationsInput | number
    awayGoalsScored?: IntFieldUpdateOperationsInput | number
    awayGoalsConceded?: IntFieldUpdateOperationsInput | number
    awayAvgScored?: FloatFieldUpdateOperationsInput | number
    awayAvgConceded?: FloatFieldUpdateOperationsInput | number
    probHome?: FloatFieldUpdateOperationsInput | number
    probDraw?: FloatFieldUpdateOperationsInput | number
    probAway?: FloatFieldUpdateOperationsInput | number
    predictedResult?: NullableStringFieldUpdateOperationsInput | string | null
    over15Rate?: FloatFieldUpdateOperationsInput | number
    over25Rate?: FloatFieldUpdateOperationsInput | number
    bttsRate?: FloatFieldUpdateOperationsInput | number
    xGHome?: NullableFloatFieldUpdateOperationsInput | number | null
    xGAway?: NullableFloatFieldUpdateOperationsInput | number | null
    homeInjuredCount?: IntFieldUpdateOperationsInput | number
    awayInjuredCount?: IntFieldUpdateOperationsInput | number
    oddsHome?: NullableFloatFieldUpdateOperationsInput | number | null
    oddsDraw?: NullableFloatFieldUpdateOperationsInput | number | null
    oddsAway?: NullableFloatFieldUpdateOperationsInput | number | null
    dataSource?: StringFieldUpdateOperationsInput | string
    fetchedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type H2HRecordCreateInput = {
    id?: string
    homeTeamId: string
    awayTeamId: string
    totalMeetings?: number
    homeWins?: number
    awayWins?: number
    draws?: number
    totalGoals?: number
    avgGoalsPerGame?: number
    homeWinRate?: number
    awayWinRate?: number
    drawRate?: number
    updatedAt?: Date | string
  }

  export type H2HRecordUncheckedCreateInput = {
    id?: string
    homeTeamId: string
    awayTeamId: string
    totalMeetings?: number
    homeWins?: number
    awayWins?: number
    draws?: number
    totalGoals?: number
    avgGoalsPerGame?: number
    homeWinRate?: number
    awayWinRate?: number
    drawRate?: number
    updatedAt?: Date | string
  }

  export type H2HRecordUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    homeTeamId?: StringFieldUpdateOperationsInput | string
    awayTeamId?: StringFieldUpdateOperationsInput | string
    totalMeetings?: IntFieldUpdateOperationsInput | number
    homeWins?: IntFieldUpdateOperationsInput | number
    awayWins?: IntFieldUpdateOperationsInput | number
    draws?: IntFieldUpdateOperationsInput | number
    totalGoals?: IntFieldUpdateOperationsInput | number
    avgGoalsPerGame?: FloatFieldUpdateOperationsInput | number
    homeWinRate?: FloatFieldUpdateOperationsInput | number
    awayWinRate?: FloatFieldUpdateOperationsInput | number
    drawRate?: FloatFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type H2HRecordUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    homeTeamId?: StringFieldUpdateOperationsInput | string
    awayTeamId?: StringFieldUpdateOperationsInput | string
    totalMeetings?: IntFieldUpdateOperationsInput | number
    homeWins?: IntFieldUpdateOperationsInput | number
    awayWins?: IntFieldUpdateOperationsInput | number
    draws?: IntFieldUpdateOperationsInput | number
    totalGoals?: IntFieldUpdateOperationsInput | number
    avgGoalsPerGame?: FloatFieldUpdateOperationsInput | number
    homeWinRate?: FloatFieldUpdateOperationsInput | number
    awayWinRate?: FloatFieldUpdateOperationsInput | number
    drawRate?: FloatFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type H2HRecordCreateManyInput = {
    id?: string
    homeTeamId: string
    awayTeamId: string
    totalMeetings?: number
    homeWins?: number
    awayWins?: number
    draws?: number
    totalGoals?: number
    avgGoalsPerGame?: number
    homeWinRate?: number
    awayWinRate?: number
    drawRate?: number
    updatedAt?: Date | string
  }

  export type H2HRecordUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    homeTeamId?: StringFieldUpdateOperationsInput | string
    awayTeamId?: StringFieldUpdateOperationsInput | string
    totalMeetings?: IntFieldUpdateOperationsInput | number
    homeWins?: IntFieldUpdateOperationsInput | number
    awayWins?: IntFieldUpdateOperationsInput | number
    draws?: IntFieldUpdateOperationsInput | number
    totalGoals?: IntFieldUpdateOperationsInput | number
    avgGoalsPerGame?: FloatFieldUpdateOperationsInput | number
    homeWinRate?: FloatFieldUpdateOperationsInput | number
    awayWinRate?: FloatFieldUpdateOperationsInput | number
    drawRate?: FloatFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type H2HRecordUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    homeTeamId?: StringFieldUpdateOperationsInput | string
    awayTeamId?: StringFieldUpdateOperationsInput | string
    totalMeetings?: IntFieldUpdateOperationsInput | number
    homeWins?: IntFieldUpdateOperationsInput | number
    awayWins?: IntFieldUpdateOperationsInput | number
    draws?: IntFieldUpdateOperationsInput | number
    totalGoals?: IntFieldUpdateOperationsInput | number
    avgGoalsPerGame?: FloatFieldUpdateOperationsInput | number
    homeWinRate?: FloatFieldUpdateOperationsInput | number
    awayWinRate?: FloatFieldUpdateOperationsInput | number
    drawRate?: FloatFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TeamStrengthCreateInput = {
    id?: string
    teamId: string
    teamName: string
    leagueId: string
    attackStrength?: number
    defenceStrength?: number
    overallStrength?: number
    homeStrength?: number
    awayStrength?: number
    formPoints?: number
    formString?: string | null
    gamesPlayed?: number
    updatedAt?: Date | string
  }

  export type TeamStrengthUncheckedCreateInput = {
    id?: string
    teamId: string
    teamName: string
    leagueId: string
    attackStrength?: number
    defenceStrength?: number
    overallStrength?: number
    homeStrength?: number
    awayStrength?: number
    formPoints?: number
    formString?: string | null
    gamesPlayed?: number
    updatedAt?: Date | string
  }

  export type TeamStrengthUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    teamId?: StringFieldUpdateOperationsInput | string
    teamName?: StringFieldUpdateOperationsInput | string
    leagueId?: StringFieldUpdateOperationsInput | string
    attackStrength?: FloatFieldUpdateOperationsInput | number
    defenceStrength?: FloatFieldUpdateOperationsInput | number
    overallStrength?: FloatFieldUpdateOperationsInput | number
    homeStrength?: FloatFieldUpdateOperationsInput | number
    awayStrength?: FloatFieldUpdateOperationsInput | number
    formPoints?: IntFieldUpdateOperationsInput | number
    formString?: NullableStringFieldUpdateOperationsInput | string | null
    gamesPlayed?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TeamStrengthUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    teamId?: StringFieldUpdateOperationsInput | string
    teamName?: StringFieldUpdateOperationsInput | string
    leagueId?: StringFieldUpdateOperationsInput | string
    attackStrength?: FloatFieldUpdateOperationsInput | number
    defenceStrength?: FloatFieldUpdateOperationsInput | number
    overallStrength?: FloatFieldUpdateOperationsInput | number
    homeStrength?: FloatFieldUpdateOperationsInput | number
    awayStrength?: FloatFieldUpdateOperationsInput | number
    formPoints?: IntFieldUpdateOperationsInput | number
    formString?: NullableStringFieldUpdateOperationsInput | string | null
    gamesPlayed?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TeamStrengthCreateManyInput = {
    id?: string
    teamId: string
    teamName: string
    leagueId: string
    attackStrength?: number
    defenceStrength?: number
    overallStrength?: number
    homeStrength?: number
    awayStrength?: number
    formPoints?: number
    formString?: string | null
    gamesPlayed?: number
    updatedAt?: Date | string
  }

  export type TeamStrengthUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    teamId?: StringFieldUpdateOperationsInput | string
    teamName?: StringFieldUpdateOperationsInput | string
    leagueId?: StringFieldUpdateOperationsInput | string
    attackStrength?: FloatFieldUpdateOperationsInput | number
    defenceStrength?: FloatFieldUpdateOperationsInput | number
    overallStrength?: FloatFieldUpdateOperationsInput | number
    homeStrength?: FloatFieldUpdateOperationsInput | number
    awayStrength?: FloatFieldUpdateOperationsInput | number
    formPoints?: IntFieldUpdateOperationsInput | number
    formString?: NullableStringFieldUpdateOperationsInput | string | null
    gamesPlayed?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TeamStrengthUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    teamId?: StringFieldUpdateOperationsInput | string
    teamName?: StringFieldUpdateOperationsInput | string
    leagueId?: StringFieldUpdateOperationsInput | string
    attackStrength?: FloatFieldUpdateOperationsInput | number
    defenceStrength?: FloatFieldUpdateOperationsInput | number
    overallStrength?: FloatFieldUpdateOperationsInput | number
    homeStrength?: FloatFieldUpdateOperationsInput | number
    awayStrength?: FloatFieldUpdateOperationsInput | number
    formPoints?: IntFieldUpdateOperationsInput | number
    formString?: NullableStringFieldUpdateOperationsInput | string | null
    gamesPlayed?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConfidenceScoreCreateInput = {
    id?: string
    pick: string
    market: string
    formScore?: number
    homeAwayScore?: number
    h2hScore?: number
    goalTrendScore?: number
    oddsScore?: number
    teamStrengthScore?: number
    grooveScore?: number
    riskLevel?: $Enums.RiskLevel
    confidence?: number
    impliedProbability?: number
    realProbability?: number
    valueEdge?: number
    calculatedAt?: Date | string
    fixture: FixtureCreateNestedOneWithoutConfidenceScoresInput
  }

  export type ConfidenceScoreUncheckedCreateInput = {
    id?: string
    fixtureId: string
    pick: string
    market: string
    formScore?: number
    homeAwayScore?: number
    h2hScore?: number
    goalTrendScore?: number
    oddsScore?: number
    teamStrengthScore?: number
    grooveScore?: number
    riskLevel?: $Enums.RiskLevel
    confidence?: number
    impliedProbability?: number
    realProbability?: number
    valueEdge?: number
    calculatedAt?: Date | string
  }

  export type ConfidenceScoreUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    pick?: StringFieldUpdateOperationsInput | string
    market?: StringFieldUpdateOperationsInput | string
    formScore?: FloatFieldUpdateOperationsInput | number
    homeAwayScore?: FloatFieldUpdateOperationsInput | number
    h2hScore?: FloatFieldUpdateOperationsInput | number
    goalTrendScore?: FloatFieldUpdateOperationsInput | number
    oddsScore?: FloatFieldUpdateOperationsInput | number
    teamStrengthScore?: FloatFieldUpdateOperationsInput | number
    grooveScore?: FloatFieldUpdateOperationsInput | number
    riskLevel?: EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel
    confidence?: IntFieldUpdateOperationsInput | number
    impliedProbability?: FloatFieldUpdateOperationsInput | number
    realProbability?: FloatFieldUpdateOperationsInput | number
    valueEdge?: FloatFieldUpdateOperationsInput | number
    calculatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fixture?: FixtureUpdateOneRequiredWithoutConfidenceScoresNestedInput
  }

  export type ConfidenceScoreUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    fixtureId?: StringFieldUpdateOperationsInput | string
    pick?: StringFieldUpdateOperationsInput | string
    market?: StringFieldUpdateOperationsInput | string
    formScore?: FloatFieldUpdateOperationsInput | number
    homeAwayScore?: FloatFieldUpdateOperationsInput | number
    h2hScore?: FloatFieldUpdateOperationsInput | number
    goalTrendScore?: FloatFieldUpdateOperationsInput | number
    oddsScore?: FloatFieldUpdateOperationsInput | number
    teamStrengthScore?: FloatFieldUpdateOperationsInput | number
    grooveScore?: FloatFieldUpdateOperationsInput | number
    riskLevel?: EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel
    confidence?: IntFieldUpdateOperationsInput | number
    impliedProbability?: FloatFieldUpdateOperationsInput | number
    realProbability?: FloatFieldUpdateOperationsInput | number
    valueEdge?: FloatFieldUpdateOperationsInput | number
    calculatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConfidenceScoreCreateManyInput = {
    id?: string
    fixtureId: string
    pick: string
    market: string
    formScore?: number
    homeAwayScore?: number
    h2hScore?: number
    goalTrendScore?: number
    oddsScore?: number
    teamStrengthScore?: number
    grooveScore?: number
    riskLevel?: $Enums.RiskLevel
    confidence?: number
    impliedProbability?: number
    realProbability?: number
    valueEdge?: number
    calculatedAt?: Date | string
  }

  export type ConfidenceScoreUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    pick?: StringFieldUpdateOperationsInput | string
    market?: StringFieldUpdateOperationsInput | string
    formScore?: FloatFieldUpdateOperationsInput | number
    homeAwayScore?: FloatFieldUpdateOperationsInput | number
    h2hScore?: FloatFieldUpdateOperationsInput | number
    goalTrendScore?: FloatFieldUpdateOperationsInput | number
    oddsScore?: FloatFieldUpdateOperationsInput | number
    teamStrengthScore?: FloatFieldUpdateOperationsInput | number
    grooveScore?: FloatFieldUpdateOperationsInput | number
    riskLevel?: EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel
    confidence?: IntFieldUpdateOperationsInput | number
    impliedProbability?: FloatFieldUpdateOperationsInput | number
    realProbability?: FloatFieldUpdateOperationsInput | number
    valueEdge?: FloatFieldUpdateOperationsInput | number
    calculatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConfidenceScoreUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    fixtureId?: StringFieldUpdateOperationsInput | string
    pick?: StringFieldUpdateOperationsInput | string
    market?: StringFieldUpdateOperationsInput | string
    formScore?: FloatFieldUpdateOperationsInput | number
    homeAwayScore?: FloatFieldUpdateOperationsInput | number
    h2hScore?: FloatFieldUpdateOperationsInput | number
    goalTrendScore?: FloatFieldUpdateOperationsInput | number
    oddsScore?: FloatFieldUpdateOperationsInput | number
    teamStrengthScore?: FloatFieldUpdateOperationsInput | number
    grooveScore?: FloatFieldUpdateOperationsInput | number
    riskLevel?: EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel
    confidence?: IntFieldUpdateOperationsInput | number
    impliedProbability?: FloatFieldUpdateOperationsInput | number
    realProbability?: FloatFieldUpdateOperationsInput | number
    valueEdge?: FloatFieldUpdateOperationsInput | number
    calculatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MarketRuleCreateInput = {
    id?: string
    marketKey: string
    marketName: string
    marketGroup: string
    riskCategory?: $Enums.MarketRisk
    minConfidence?: number
    keepThreshold?: number
    replaceThreshold?: number
    removeThreshold?: number
    requiredMetrics: JsonNullValueInput | InputJsonValue
    formWeight?: number
    homeAwayWeight?: number
    h2hWeight?: number
    goalTrendWeight?: number
    oddsWeight?: number
    teamStrengthWeight?: number
    correlationGroup?: string | null
    safeAlternative?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type MarketRuleUncheckedCreateInput = {
    id?: string
    marketKey: string
    marketName: string
    marketGroup: string
    riskCategory?: $Enums.MarketRisk
    minConfidence?: number
    keepThreshold?: number
    replaceThreshold?: number
    removeThreshold?: number
    requiredMetrics: JsonNullValueInput | InputJsonValue
    formWeight?: number
    homeAwayWeight?: number
    h2hWeight?: number
    goalTrendWeight?: number
    oddsWeight?: number
    teamStrengthWeight?: number
    correlationGroup?: string | null
    safeAlternative?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type MarketRuleUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    marketKey?: StringFieldUpdateOperationsInput | string
    marketName?: StringFieldUpdateOperationsInput | string
    marketGroup?: StringFieldUpdateOperationsInput | string
    riskCategory?: EnumMarketRiskFieldUpdateOperationsInput | $Enums.MarketRisk
    minConfidence?: IntFieldUpdateOperationsInput | number
    keepThreshold?: IntFieldUpdateOperationsInput | number
    replaceThreshold?: IntFieldUpdateOperationsInput | number
    removeThreshold?: IntFieldUpdateOperationsInput | number
    requiredMetrics?: JsonNullValueInput | InputJsonValue
    formWeight?: FloatFieldUpdateOperationsInput | number
    homeAwayWeight?: FloatFieldUpdateOperationsInput | number
    h2hWeight?: FloatFieldUpdateOperationsInput | number
    goalTrendWeight?: FloatFieldUpdateOperationsInput | number
    oddsWeight?: FloatFieldUpdateOperationsInput | number
    teamStrengthWeight?: FloatFieldUpdateOperationsInput | number
    correlationGroup?: NullableStringFieldUpdateOperationsInput | string | null
    safeAlternative?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MarketRuleUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    marketKey?: StringFieldUpdateOperationsInput | string
    marketName?: StringFieldUpdateOperationsInput | string
    marketGroup?: StringFieldUpdateOperationsInput | string
    riskCategory?: EnumMarketRiskFieldUpdateOperationsInput | $Enums.MarketRisk
    minConfidence?: IntFieldUpdateOperationsInput | number
    keepThreshold?: IntFieldUpdateOperationsInput | number
    replaceThreshold?: IntFieldUpdateOperationsInput | number
    removeThreshold?: IntFieldUpdateOperationsInput | number
    requiredMetrics?: JsonNullValueInput | InputJsonValue
    formWeight?: FloatFieldUpdateOperationsInput | number
    homeAwayWeight?: FloatFieldUpdateOperationsInput | number
    h2hWeight?: FloatFieldUpdateOperationsInput | number
    goalTrendWeight?: FloatFieldUpdateOperationsInput | number
    oddsWeight?: FloatFieldUpdateOperationsInput | number
    teamStrengthWeight?: FloatFieldUpdateOperationsInput | number
    correlationGroup?: NullableStringFieldUpdateOperationsInput | string | null
    safeAlternative?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MarketRuleCreateManyInput = {
    id?: string
    marketKey: string
    marketName: string
    marketGroup: string
    riskCategory?: $Enums.MarketRisk
    minConfidence?: number
    keepThreshold?: number
    replaceThreshold?: number
    removeThreshold?: number
    requiredMetrics: JsonNullValueInput | InputJsonValue
    formWeight?: number
    homeAwayWeight?: number
    h2hWeight?: number
    goalTrendWeight?: number
    oddsWeight?: number
    teamStrengthWeight?: number
    correlationGroup?: string | null
    safeAlternative?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type MarketRuleUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    marketKey?: StringFieldUpdateOperationsInput | string
    marketName?: StringFieldUpdateOperationsInput | string
    marketGroup?: StringFieldUpdateOperationsInput | string
    riskCategory?: EnumMarketRiskFieldUpdateOperationsInput | $Enums.MarketRisk
    minConfidence?: IntFieldUpdateOperationsInput | number
    keepThreshold?: IntFieldUpdateOperationsInput | number
    replaceThreshold?: IntFieldUpdateOperationsInput | number
    removeThreshold?: IntFieldUpdateOperationsInput | number
    requiredMetrics?: JsonNullValueInput | InputJsonValue
    formWeight?: FloatFieldUpdateOperationsInput | number
    homeAwayWeight?: FloatFieldUpdateOperationsInput | number
    h2hWeight?: FloatFieldUpdateOperationsInput | number
    goalTrendWeight?: FloatFieldUpdateOperationsInput | number
    oddsWeight?: FloatFieldUpdateOperationsInput | number
    teamStrengthWeight?: FloatFieldUpdateOperationsInput | number
    correlationGroup?: NullableStringFieldUpdateOperationsInput | string | null
    safeAlternative?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MarketRuleUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    marketKey?: StringFieldUpdateOperationsInput | string
    marketName?: StringFieldUpdateOperationsInput | string
    marketGroup?: StringFieldUpdateOperationsInput | string
    riskCategory?: EnumMarketRiskFieldUpdateOperationsInput | $Enums.MarketRisk
    minConfidence?: IntFieldUpdateOperationsInput | number
    keepThreshold?: IntFieldUpdateOperationsInput | number
    replaceThreshold?: IntFieldUpdateOperationsInput | number
    removeThreshold?: IntFieldUpdateOperationsInput | number
    requiredMetrics?: JsonNullValueInput | InputJsonValue
    formWeight?: FloatFieldUpdateOperationsInput | number
    homeAwayWeight?: FloatFieldUpdateOperationsInput | number
    h2hWeight?: FloatFieldUpdateOperationsInput | number
    goalTrendWeight?: FloatFieldUpdateOperationsInput | number
    oddsWeight?: FloatFieldUpdateOperationsInput | number
    teamStrengthWeight?: FloatFieldUpdateOperationsInput | number
    correlationGroup?: NullableStringFieldUpdateOperationsInput | string | null
    safeAlternative?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ValueBetScanCreateInput = {
    id?: string
    pick: string
    market: string
    odds: number
    grooveScore: number
    realProbability: number
    impliedProbability: number
    valueEdge: number
    confidence: number
    reason: string
    scanDate?: Date | string
    isActive?: boolean
    fixture: FixtureCreateNestedOneWithoutValueBetScansInput
  }

  export type ValueBetScanUncheckedCreateInput = {
    id?: string
    fixtureId: string
    pick: string
    market: string
    odds: number
    grooveScore: number
    realProbability: number
    impliedProbability: number
    valueEdge: number
    confidence: number
    reason: string
    scanDate?: Date | string
    isActive?: boolean
  }

  export type ValueBetScanUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    pick?: StringFieldUpdateOperationsInput | string
    market?: StringFieldUpdateOperationsInput | string
    odds?: FloatFieldUpdateOperationsInput | number
    grooveScore?: FloatFieldUpdateOperationsInput | number
    realProbability?: FloatFieldUpdateOperationsInput | number
    impliedProbability?: FloatFieldUpdateOperationsInput | number
    valueEdge?: FloatFieldUpdateOperationsInput | number
    confidence?: IntFieldUpdateOperationsInput | number
    reason?: StringFieldUpdateOperationsInput | string
    scanDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    fixture?: FixtureUpdateOneRequiredWithoutValueBetScansNestedInput
  }

  export type ValueBetScanUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    fixtureId?: StringFieldUpdateOperationsInput | string
    pick?: StringFieldUpdateOperationsInput | string
    market?: StringFieldUpdateOperationsInput | string
    odds?: FloatFieldUpdateOperationsInput | number
    grooveScore?: FloatFieldUpdateOperationsInput | number
    realProbability?: FloatFieldUpdateOperationsInput | number
    impliedProbability?: FloatFieldUpdateOperationsInput | number
    valueEdge?: FloatFieldUpdateOperationsInput | number
    confidence?: IntFieldUpdateOperationsInput | number
    reason?: StringFieldUpdateOperationsInput | string
    scanDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
  }

  export type ValueBetScanCreateManyInput = {
    id?: string
    fixtureId: string
    pick: string
    market: string
    odds: number
    grooveScore: number
    realProbability: number
    impliedProbability: number
    valueEdge: number
    confidence: number
    reason: string
    scanDate?: Date | string
    isActive?: boolean
  }

  export type ValueBetScanUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    pick?: StringFieldUpdateOperationsInput | string
    market?: StringFieldUpdateOperationsInput | string
    odds?: FloatFieldUpdateOperationsInput | number
    grooveScore?: FloatFieldUpdateOperationsInput | number
    realProbability?: FloatFieldUpdateOperationsInput | number
    impliedProbability?: FloatFieldUpdateOperationsInput | number
    valueEdge?: FloatFieldUpdateOperationsInput | number
    confidence?: IntFieldUpdateOperationsInput | number
    reason?: StringFieldUpdateOperationsInput | string
    scanDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
  }

  export type ValueBetScanUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    fixtureId?: StringFieldUpdateOperationsInput | string
    pick?: StringFieldUpdateOperationsInput | string
    market?: StringFieldUpdateOperationsInput | string
    odds?: FloatFieldUpdateOperationsInput | number
    grooveScore?: FloatFieldUpdateOperationsInput | number
    realProbability?: FloatFieldUpdateOperationsInput | number
    impliedProbability?: FloatFieldUpdateOperationsInput | number
    valueEdge?: FloatFieldUpdateOperationsInput | number
    confidence?: IntFieldUpdateOperationsInput | number
    reason?: StringFieldUpdateOperationsInput | string
    scanDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
  }

  export type SlipAnalysisLogCreateInput = {
    id?: string
    userId: string
    slipId?: string | null
    totalGames: number
    keptGames: number
    removedGames: number
    replacedGames: number
    originalOdds: number
    newOdds: number
    targetOdds: number
    allowSwitching?: boolean
    avgGrooveScore?: number
    analysedAt?: Date | string
  }

  export type SlipAnalysisLogUncheckedCreateInput = {
    id?: string
    userId: string
    slipId?: string | null
    totalGames: number
    keptGames: number
    removedGames: number
    replacedGames: number
    originalOdds: number
    newOdds: number
    targetOdds: number
    allowSwitching?: boolean
    avgGrooveScore?: number
    analysedAt?: Date | string
  }

  export type SlipAnalysisLogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    slipId?: NullableStringFieldUpdateOperationsInput | string | null
    totalGames?: IntFieldUpdateOperationsInput | number
    keptGames?: IntFieldUpdateOperationsInput | number
    removedGames?: IntFieldUpdateOperationsInput | number
    replacedGames?: IntFieldUpdateOperationsInput | number
    originalOdds?: FloatFieldUpdateOperationsInput | number
    newOdds?: FloatFieldUpdateOperationsInput | number
    targetOdds?: FloatFieldUpdateOperationsInput | number
    allowSwitching?: BoolFieldUpdateOperationsInput | boolean
    avgGrooveScore?: FloatFieldUpdateOperationsInput | number
    analysedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SlipAnalysisLogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    slipId?: NullableStringFieldUpdateOperationsInput | string | null
    totalGames?: IntFieldUpdateOperationsInput | number
    keptGames?: IntFieldUpdateOperationsInput | number
    removedGames?: IntFieldUpdateOperationsInput | number
    replacedGames?: IntFieldUpdateOperationsInput | number
    originalOdds?: FloatFieldUpdateOperationsInput | number
    newOdds?: FloatFieldUpdateOperationsInput | number
    targetOdds?: FloatFieldUpdateOperationsInput | number
    allowSwitching?: BoolFieldUpdateOperationsInput | boolean
    avgGrooveScore?: FloatFieldUpdateOperationsInput | number
    analysedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SlipAnalysisLogCreateManyInput = {
    id?: string
    userId: string
    slipId?: string | null
    totalGames: number
    keptGames: number
    removedGames: number
    replacedGames: number
    originalOdds: number
    newOdds: number
    targetOdds: number
    allowSwitching?: boolean
    avgGrooveScore?: number
    analysedAt?: Date | string
  }

  export type SlipAnalysisLogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    slipId?: NullableStringFieldUpdateOperationsInput | string | null
    totalGames?: IntFieldUpdateOperationsInput | number
    keptGames?: IntFieldUpdateOperationsInput | number
    removedGames?: IntFieldUpdateOperationsInput | number
    replacedGames?: IntFieldUpdateOperationsInput | number
    originalOdds?: FloatFieldUpdateOperationsInput | number
    newOdds?: FloatFieldUpdateOperationsInput | number
    targetOdds?: FloatFieldUpdateOperationsInput | number
    allowSwitching?: BoolFieldUpdateOperationsInput | boolean
    avgGrooveScore?: FloatFieldUpdateOperationsInput | number
    analysedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SlipAnalysisLogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    slipId?: NullableStringFieldUpdateOperationsInput | string | null
    totalGames?: IntFieldUpdateOperationsInput | number
    keptGames?: IntFieldUpdateOperationsInput | number
    removedGames?: IntFieldUpdateOperationsInput | number
    replacedGames?: IntFieldUpdateOperationsInput | number
    originalOdds?: FloatFieldUpdateOperationsInput | number
    newOdds?: FloatFieldUpdateOperationsInput | number
    targetOdds?: FloatFieldUpdateOperationsInput | number
    allowSwitching?: BoolFieldUpdateOperationsInput | boolean
    avgGrooveScore?: FloatFieldUpdateOperationsInput | number
    analysedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AccumulatorBuildCreateInput = {
    id?: string
    userId: string
    targetOdds: number
    actualOdds: number
    riskLevel: $Enums.RiskLevel
    legsCount: number
    avgGrooveScore: number
    picks: JsonNullValueInput | InputJsonValue
    builtAt?: Date | string
  }

  export type AccumulatorBuildUncheckedCreateInput = {
    id?: string
    userId: string
    targetOdds: number
    actualOdds: number
    riskLevel: $Enums.RiskLevel
    legsCount: number
    avgGrooveScore: number
    picks: JsonNullValueInput | InputJsonValue
    builtAt?: Date | string
  }

  export type AccumulatorBuildUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    targetOdds?: FloatFieldUpdateOperationsInput | number
    actualOdds?: FloatFieldUpdateOperationsInput | number
    riskLevel?: EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel
    legsCount?: IntFieldUpdateOperationsInput | number
    avgGrooveScore?: FloatFieldUpdateOperationsInput | number
    picks?: JsonNullValueInput | InputJsonValue
    builtAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AccumulatorBuildUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    targetOdds?: FloatFieldUpdateOperationsInput | number
    actualOdds?: FloatFieldUpdateOperationsInput | number
    riskLevel?: EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel
    legsCount?: IntFieldUpdateOperationsInput | number
    avgGrooveScore?: FloatFieldUpdateOperationsInput | number
    picks?: JsonNullValueInput | InputJsonValue
    builtAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AccumulatorBuildCreateManyInput = {
    id?: string
    userId: string
    targetOdds: number
    actualOdds: number
    riskLevel: $Enums.RiskLevel
    legsCount: number
    avgGrooveScore: number
    picks: JsonNullValueInput | InputJsonValue
    builtAt?: Date | string
  }

  export type AccumulatorBuildUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    targetOdds?: FloatFieldUpdateOperationsInput | number
    actualOdds?: FloatFieldUpdateOperationsInput | number
    riskLevel?: EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel
    legsCount?: IntFieldUpdateOperationsInput | number
    avgGrooveScore?: FloatFieldUpdateOperationsInput | number
    picks?: JsonNullValueInput | InputJsonValue
    builtAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AccumulatorBuildUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    targetOdds?: FloatFieldUpdateOperationsInput | number
    actualOdds?: FloatFieldUpdateOperationsInput | number
    riskLevel?: EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel
    legsCount?: IntFieldUpdateOperationsInput | number
    avgGrooveScore?: FloatFieldUpdateOperationsInput | number
    picks?: JsonNullValueInput | InputJsonValue
    builtAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type EnumFixtureStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.FixtureStatus | EnumFixtureStatusFieldRefInput<$PrismaModel>
    in?: $Enums.FixtureStatus[] | ListEnumFixtureStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.FixtureStatus[] | ListEnumFixtureStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumFixtureStatusFilter<$PrismaModel> | $Enums.FixtureStatus
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type MatchStatisticsNullableScalarRelationFilter = {
    is?: MatchStatisticsWhereInput | null
    isNot?: MatchStatisticsWhereInput | null
  }

  export type ConfidenceScoreListRelationFilter = {
    every?: ConfidenceScoreWhereInput
    some?: ConfidenceScoreWhereInput
    none?: ConfidenceScoreWhereInput
  }

  export type ValueBetScanListRelationFilter = {
    every?: ValueBetScanWhereInput
    some?: ValueBetScanWhereInput
    none?: ValueBetScanWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ConfidenceScoreOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ValueBetScanOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type FixtureCountOrderByAggregateInput = {
    id?: SortOrder
    fixtureId?: SortOrder
    homeTeam?: SortOrder
    awayTeam?: SortOrder
    homeTeamId?: SortOrder
    awayTeamId?: SortOrder
    league?: SortOrder
    leagueId?: SortOrder
    country?: SortOrder
    matchDate?: SortOrder
    status?: SortOrder
    homeScore?: SortOrder
    awayScore?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FixtureAvgOrderByAggregateInput = {
    homeScore?: SortOrder
    awayScore?: SortOrder
  }

  export type FixtureMaxOrderByAggregateInput = {
    id?: SortOrder
    fixtureId?: SortOrder
    homeTeam?: SortOrder
    awayTeam?: SortOrder
    homeTeamId?: SortOrder
    awayTeamId?: SortOrder
    league?: SortOrder
    leagueId?: SortOrder
    country?: SortOrder
    matchDate?: SortOrder
    status?: SortOrder
    homeScore?: SortOrder
    awayScore?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FixtureMinOrderByAggregateInput = {
    id?: SortOrder
    fixtureId?: SortOrder
    homeTeam?: SortOrder
    awayTeam?: SortOrder
    homeTeamId?: SortOrder
    awayTeamId?: SortOrder
    league?: SortOrder
    leagueId?: SortOrder
    country?: SortOrder
    matchDate?: SortOrder
    status?: SortOrder
    homeScore?: SortOrder
    awayScore?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FixtureSumOrderByAggregateInput = {
    homeScore?: SortOrder
    awayScore?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumFixtureStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FixtureStatus | EnumFixtureStatusFieldRefInput<$PrismaModel>
    in?: $Enums.FixtureStatus[] | ListEnumFixtureStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.FixtureStatus[] | ListEnumFixtureStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumFixtureStatusWithAggregatesFilter<$PrismaModel> | $Enums.FixtureStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumFixtureStatusFilter<$PrismaModel>
    _max?: NestedEnumFixtureStatusFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type FixtureScalarRelationFilter = {
    is?: FixtureWhereInput
    isNot?: FixtureWhereInput
  }

  export type MatchStatisticsCountOrderByAggregateInput = {
    id?: SortOrder
    fixtureId?: SortOrder
    homeFormString?: SortOrder
    homeWins?: SortOrder
    homeDraws?: SortOrder
    homeLosses?: SortOrder
    homeGoalsScored?: SortOrder
    homeGoalsConceded?: SortOrder
    homeAvgScored?: SortOrder
    homeAvgConceded?: SortOrder
    awayFormString?: SortOrder
    awayWins?: SortOrder
    awayDraws?: SortOrder
    awayLosses?: SortOrder
    awayGoalsScored?: SortOrder
    awayGoalsConceded?: SortOrder
    awayAvgScored?: SortOrder
    awayAvgConceded?: SortOrder
    probHome?: SortOrder
    probDraw?: SortOrder
    probAway?: SortOrder
    predictedResult?: SortOrder
    over15Rate?: SortOrder
    over25Rate?: SortOrder
    bttsRate?: SortOrder
    xGHome?: SortOrder
    xGAway?: SortOrder
    homeInjuredCount?: SortOrder
    awayInjuredCount?: SortOrder
    oddsHome?: SortOrder
    oddsDraw?: SortOrder
    oddsAway?: SortOrder
    dataSource?: SortOrder
    fetchedAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MatchStatisticsAvgOrderByAggregateInput = {
    homeWins?: SortOrder
    homeDraws?: SortOrder
    homeLosses?: SortOrder
    homeGoalsScored?: SortOrder
    homeGoalsConceded?: SortOrder
    homeAvgScored?: SortOrder
    homeAvgConceded?: SortOrder
    awayWins?: SortOrder
    awayDraws?: SortOrder
    awayLosses?: SortOrder
    awayGoalsScored?: SortOrder
    awayGoalsConceded?: SortOrder
    awayAvgScored?: SortOrder
    awayAvgConceded?: SortOrder
    probHome?: SortOrder
    probDraw?: SortOrder
    probAway?: SortOrder
    over15Rate?: SortOrder
    over25Rate?: SortOrder
    bttsRate?: SortOrder
    xGHome?: SortOrder
    xGAway?: SortOrder
    homeInjuredCount?: SortOrder
    awayInjuredCount?: SortOrder
    oddsHome?: SortOrder
    oddsDraw?: SortOrder
    oddsAway?: SortOrder
  }

  export type MatchStatisticsMaxOrderByAggregateInput = {
    id?: SortOrder
    fixtureId?: SortOrder
    homeFormString?: SortOrder
    homeWins?: SortOrder
    homeDraws?: SortOrder
    homeLosses?: SortOrder
    homeGoalsScored?: SortOrder
    homeGoalsConceded?: SortOrder
    homeAvgScored?: SortOrder
    homeAvgConceded?: SortOrder
    awayFormString?: SortOrder
    awayWins?: SortOrder
    awayDraws?: SortOrder
    awayLosses?: SortOrder
    awayGoalsScored?: SortOrder
    awayGoalsConceded?: SortOrder
    awayAvgScored?: SortOrder
    awayAvgConceded?: SortOrder
    probHome?: SortOrder
    probDraw?: SortOrder
    probAway?: SortOrder
    predictedResult?: SortOrder
    over15Rate?: SortOrder
    over25Rate?: SortOrder
    bttsRate?: SortOrder
    xGHome?: SortOrder
    xGAway?: SortOrder
    homeInjuredCount?: SortOrder
    awayInjuredCount?: SortOrder
    oddsHome?: SortOrder
    oddsDraw?: SortOrder
    oddsAway?: SortOrder
    dataSource?: SortOrder
    fetchedAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MatchStatisticsMinOrderByAggregateInput = {
    id?: SortOrder
    fixtureId?: SortOrder
    homeFormString?: SortOrder
    homeWins?: SortOrder
    homeDraws?: SortOrder
    homeLosses?: SortOrder
    homeGoalsScored?: SortOrder
    homeGoalsConceded?: SortOrder
    homeAvgScored?: SortOrder
    homeAvgConceded?: SortOrder
    awayFormString?: SortOrder
    awayWins?: SortOrder
    awayDraws?: SortOrder
    awayLosses?: SortOrder
    awayGoalsScored?: SortOrder
    awayGoalsConceded?: SortOrder
    awayAvgScored?: SortOrder
    awayAvgConceded?: SortOrder
    probHome?: SortOrder
    probDraw?: SortOrder
    probAway?: SortOrder
    predictedResult?: SortOrder
    over15Rate?: SortOrder
    over25Rate?: SortOrder
    bttsRate?: SortOrder
    xGHome?: SortOrder
    xGAway?: SortOrder
    homeInjuredCount?: SortOrder
    awayInjuredCount?: SortOrder
    oddsHome?: SortOrder
    oddsDraw?: SortOrder
    oddsAway?: SortOrder
    dataSource?: SortOrder
    fetchedAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MatchStatisticsSumOrderByAggregateInput = {
    homeWins?: SortOrder
    homeDraws?: SortOrder
    homeLosses?: SortOrder
    homeGoalsScored?: SortOrder
    homeGoalsConceded?: SortOrder
    homeAvgScored?: SortOrder
    homeAvgConceded?: SortOrder
    awayWins?: SortOrder
    awayDraws?: SortOrder
    awayLosses?: SortOrder
    awayGoalsScored?: SortOrder
    awayGoalsConceded?: SortOrder
    awayAvgScored?: SortOrder
    awayAvgConceded?: SortOrder
    probHome?: SortOrder
    probDraw?: SortOrder
    probAway?: SortOrder
    over15Rate?: SortOrder
    over25Rate?: SortOrder
    bttsRate?: SortOrder
    xGHome?: SortOrder
    xGAway?: SortOrder
    homeInjuredCount?: SortOrder
    awayInjuredCount?: SortOrder
    oddsHome?: SortOrder
    oddsDraw?: SortOrder
    oddsAway?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type H2HRecordHomeTeamIdAwayTeamIdCompoundUniqueInput = {
    homeTeamId: string
    awayTeamId: string
  }

  export type H2HRecordCountOrderByAggregateInput = {
    id?: SortOrder
    homeTeamId?: SortOrder
    awayTeamId?: SortOrder
    totalMeetings?: SortOrder
    homeWins?: SortOrder
    awayWins?: SortOrder
    draws?: SortOrder
    totalGoals?: SortOrder
    avgGoalsPerGame?: SortOrder
    homeWinRate?: SortOrder
    awayWinRate?: SortOrder
    drawRate?: SortOrder
    updatedAt?: SortOrder
  }

  export type H2HRecordAvgOrderByAggregateInput = {
    totalMeetings?: SortOrder
    homeWins?: SortOrder
    awayWins?: SortOrder
    draws?: SortOrder
    totalGoals?: SortOrder
    avgGoalsPerGame?: SortOrder
    homeWinRate?: SortOrder
    awayWinRate?: SortOrder
    drawRate?: SortOrder
  }

  export type H2HRecordMaxOrderByAggregateInput = {
    id?: SortOrder
    homeTeamId?: SortOrder
    awayTeamId?: SortOrder
    totalMeetings?: SortOrder
    homeWins?: SortOrder
    awayWins?: SortOrder
    draws?: SortOrder
    totalGoals?: SortOrder
    avgGoalsPerGame?: SortOrder
    homeWinRate?: SortOrder
    awayWinRate?: SortOrder
    drawRate?: SortOrder
    updatedAt?: SortOrder
  }

  export type H2HRecordMinOrderByAggregateInput = {
    id?: SortOrder
    homeTeamId?: SortOrder
    awayTeamId?: SortOrder
    totalMeetings?: SortOrder
    homeWins?: SortOrder
    awayWins?: SortOrder
    draws?: SortOrder
    totalGoals?: SortOrder
    avgGoalsPerGame?: SortOrder
    homeWinRate?: SortOrder
    awayWinRate?: SortOrder
    drawRate?: SortOrder
    updatedAt?: SortOrder
  }

  export type H2HRecordSumOrderByAggregateInput = {
    totalMeetings?: SortOrder
    homeWins?: SortOrder
    awayWins?: SortOrder
    draws?: SortOrder
    totalGoals?: SortOrder
    avgGoalsPerGame?: SortOrder
    homeWinRate?: SortOrder
    awayWinRate?: SortOrder
    drawRate?: SortOrder
  }

  export type TeamStrengthCountOrderByAggregateInput = {
    id?: SortOrder
    teamId?: SortOrder
    teamName?: SortOrder
    leagueId?: SortOrder
    attackStrength?: SortOrder
    defenceStrength?: SortOrder
    overallStrength?: SortOrder
    homeStrength?: SortOrder
    awayStrength?: SortOrder
    formPoints?: SortOrder
    formString?: SortOrder
    gamesPlayed?: SortOrder
    updatedAt?: SortOrder
  }

  export type TeamStrengthAvgOrderByAggregateInput = {
    attackStrength?: SortOrder
    defenceStrength?: SortOrder
    overallStrength?: SortOrder
    homeStrength?: SortOrder
    awayStrength?: SortOrder
    formPoints?: SortOrder
    gamesPlayed?: SortOrder
  }

  export type TeamStrengthMaxOrderByAggregateInput = {
    id?: SortOrder
    teamId?: SortOrder
    teamName?: SortOrder
    leagueId?: SortOrder
    attackStrength?: SortOrder
    defenceStrength?: SortOrder
    overallStrength?: SortOrder
    homeStrength?: SortOrder
    awayStrength?: SortOrder
    formPoints?: SortOrder
    formString?: SortOrder
    gamesPlayed?: SortOrder
    updatedAt?: SortOrder
  }

  export type TeamStrengthMinOrderByAggregateInput = {
    id?: SortOrder
    teamId?: SortOrder
    teamName?: SortOrder
    leagueId?: SortOrder
    attackStrength?: SortOrder
    defenceStrength?: SortOrder
    overallStrength?: SortOrder
    homeStrength?: SortOrder
    awayStrength?: SortOrder
    formPoints?: SortOrder
    formString?: SortOrder
    gamesPlayed?: SortOrder
    updatedAt?: SortOrder
  }

  export type TeamStrengthSumOrderByAggregateInput = {
    attackStrength?: SortOrder
    defenceStrength?: SortOrder
    overallStrength?: SortOrder
    homeStrength?: SortOrder
    awayStrength?: SortOrder
    formPoints?: SortOrder
    gamesPlayed?: SortOrder
  }

  export type EnumRiskLevelFilter<$PrismaModel = never> = {
    equals?: $Enums.RiskLevel | EnumRiskLevelFieldRefInput<$PrismaModel>
    in?: $Enums.RiskLevel[] | ListEnumRiskLevelFieldRefInput<$PrismaModel>
    notIn?: $Enums.RiskLevel[] | ListEnumRiskLevelFieldRefInput<$PrismaModel>
    not?: NestedEnumRiskLevelFilter<$PrismaModel> | $Enums.RiskLevel
  }

  export type ConfidenceScoreCountOrderByAggregateInput = {
    id?: SortOrder
    fixtureId?: SortOrder
    pick?: SortOrder
    market?: SortOrder
    formScore?: SortOrder
    homeAwayScore?: SortOrder
    h2hScore?: SortOrder
    goalTrendScore?: SortOrder
    oddsScore?: SortOrder
    teamStrengthScore?: SortOrder
    grooveScore?: SortOrder
    riskLevel?: SortOrder
    confidence?: SortOrder
    impliedProbability?: SortOrder
    realProbability?: SortOrder
    valueEdge?: SortOrder
    calculatedAt?: SortOrder
  }

  export type ConfidenceScoreAvgOrderByAggregateInput = {
    formScore?: SortOrder
    homeAwayScore?: SortOrder
    h2hScore?: SortOrder
    goalTrendScore?: SortOrder
    oddsScore?: SortOrder
    teamStrengthScore?: SortOrder
    grooveScore?: SortOrder
    confidence?: SortOrder
    impliedProbability?: SortOrder
    realProbability?: SortOrder
    valueEdge?: SortOrder
  }

  export type ConfidenceScoreMaxOrderByAggregateInput = {
    id?: SortOrder
    fixtureId?: SortOrder
    pick?: SortOrder
    market?: SortOrder
    formScore?: SortOrder
    homeAwayScore?: SortOrder
    h2hScore?: SortOrder
    goalTrendScore?: SortOrder
    oddsScore?: SortOrder
    teamStrengthScore?: SortOrder
    grooveScore?: SortOrder
    riskLevel?: SortOrder
    confidence?: SortOrder
    impliedProbability?: SortOrder
    realProbability?: SortOrder
    valueEdge?: SortOrder
    calculatedAt?: SortOrder
  }

  export type ConfidenceScoreMinOrderByAggregateInput = {
    id?: SortOrder
    fixtureId?: SortOrder
    pick?: SortOrder
    market?: SortOrder
    formScore?: SortOrder
    homeAwayScore?: SortOrder
    h2hScore?: SortOrder
    goalTrendScore?: SortOrder
    oddsScore?: SortOrder
    teamStrengthScore?: SortOrder
    grooveScore?: SortOrder
    riskLevel?: SortOrder
    confidence?: SortOrder
    impliedProbability?: SortOrder
    realProbability?: SortOrder
    valueEdge?: SortOrder
    calculatedAt?: SortOrder
  }

  export type ConfidenceScoreSumOrderByAggregateInput = {
    formScore?: SortOrder
    homeAwayScore?: SortOrder
    h2hScore?: SortOrder
    goalTrendScore?: SortOrder
    oddsScore?: SortOrder
    teamStrengthScore?: SortOrder
    grooveScore?: SortOrder
    confidence?: SortOrder
    impliedProbability?: SortOrder
    realProbability?: SortOrder
    valueEdge?: SortOrder
  }

  export type EnumRiskLevelWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RiskLevel | EnumRiskLevelFieldRefInput<$PrismaModel>
    in?: $Enums.RiskLevel[] | ListEnumRiskLevelFieldRefInput<$PrismaModel>
    notIn?: $Enums.RiskLevel[] | ListEnumRiskLevelFieldRefInput<$PrismaModel>
    not?: NestedEnumRiskLevelWithAggregatesFilter<$PrismaModel> | $Enums.RiskLevel
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRiskLevelFilter<$PrismaModel>
    _max?: NestedEnumRiskLevelFilter<$PrismaModel>
  }

  export type EnumMarketRiskFilter<$PrismaModel = never> = {
    equals?: $Enums.MarketRisk | EnumMarketRiskFieldRefInput<$PrismaModel>
    in?: $Enums.MarketRisk[] | ListEnumMarketRiskFieldRefInput<$PrismaModel>
    notIn?: $Enums.MarketRisk[] | ListEnumMarketRiskFieldRefInput<$PrismaModel>
    not?: NestedEnumMarketRiskFilter<$PrismaModel> | $Enums.MarketRisk
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type MarketRuleCountOrderByAggregateInput = {
    id?: SortOrder
    marketKey?: SortOrder
    marketName?: SortOrder
    marketGroup?: SortOrder
    riskCategory?: SortOrder
    minConfidence?: SortOrder
    keepThreshold?: SortOrder
    replaceThreshold?: SortOrder
    removeThreshold?: SortOrder
    requiredMetrics?: SortOrder
    formWeight?: SortOrder
    homeAwayWeight?: SortOrder
    h2hWeight?: SortOrder
    goalTrendWeight?: SortOrder
    oddsWeight?: SortOrder
    teamStrengthWeight?: SortOrder
    correlationGroup?: SortOrder
    safeAlternative?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MarketRuleAvgOrderByAggregateInput = {
    minConfidence?: SortOrder
    keepThreshold?: SortOrder
    replaceThreshold?: SortOrder
    removeThreshold?: SortOrder
    formWeight?: SortOrder
    homeAwayWeight?: SortOrder
    h2hWeight?: SortOrder
    goalTrendWeight?: SortOrder
    oddsWeight?: SortOrder
    teamStrengthWeight?: SortOrder
  }

  export type MarketRuleMaxOrderByAggregateInput = {
    id?: SortOrder
    marketKey?: SortOrder
    marketName?: SortOrder
    marketGroup?: SortOrder
    riskCategory?: SortOrder
    minConfidence?: SortOrder
    keepThreshold?: SortOrder
    replaceThreshold?: SortOrder
    removeThreshold?: SortOrder
    formWeight?: SortOrder
    homeAwayWeight?: SortOrder
    h2hWeight?: SortOrder
    goalTrendWeight?: SortOrder
    oddsWeight?: SortOrder
    teamStrengthWeight?: SortOrder
    correlationGroup?: SortOrder
    safeAlternative?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MarketRuleMinOrderByAggregateInput = {
    id?: SortOrder
    marketKey?: SortOrder
    marketName?: SortOrder
    marketGroup?: SortOrder
    riskCategory?: SortOrder
    minConfidence?: SortOrder
    keepThreshold?: SortOrder
    replaceThreshold?: SortOrder
    removeThreshold?: SortOrder
    formWeight?: SortOrder
    homeAwayWeight?: SortOrder
    h2hWeight?: SortOrder
    goalTrendWeight?: SortOrder
    oddsWeight?: SortOrder
    teamStrengthWeight?: SortOrder
    correlationGroup?: SortOrder
    safeAlternative?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MarketRuleSumOrderByAggregateInput = {
    minConfidence?: SortOrder
    keepThreshold?: SortOrder
    replaceThreshold?: SortOrder
    removeThreshold?: SortOrder
    formWeight?: SortOrder
    homeAwayWeight?: SortOrder
    h2hWeight?: SortOrder
    goalTrendWeight?: SortOrder
    oddsWeight?: SortOrder
    teamStrengthWeight?: SortOrder
  }

  export type EnumMarketRiskWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MarketRisk | EnumMarketRiskFieldRefInput<$PrismaModel>
    in?: $Enums.MarketRisk[] | ListEnumMarketRiskFieldRefInput<$PrismaModel>
    notIn?: $Enums.MarketRisk[] | ListEnumMarketRiskFieldRefInput<$PrismaModel>
    not?: NestedEnumMarketRiskWithAggregatesFilter<$PrismaModel> | $Enums.MarketRisk
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMarketRiskFilter<$PrismaModel>
    _max?: NestedEnumMarketRiskFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type ValueBetScanCountOrderByAggregateInput = {
    id?: SortOrder
    fixtureId?: SortOrder
    pick?: SortOrder
    market?: SortOrder
    odds?: SortOrder
    grooveScore?: SortOrder
    realProbability?: SortOrder
    impliedProbability?: SortOrder
    valueEdge?: SortOrder
    confidence?: SortOrder
    reason?: SortOrder
    scanDate?: SortOrder
    isActive?: SortOrder
  }

  export type ValueBetScanAvgOrderByAggregateInput = {
    odds?: SortOrder
    grooveScore?: SortOrder
    realProbability?: SortOrder
    impliedProbability?: SortOrder
    valueEdge?: SortOrder
    confidence?: SortOrder
  }

  export type ValueBetScanMaxOrderByAggregateInput = {
    id?: SortOrder
    fixtureId?: SortOrder
    pick?: SortOrder
    market?: SortOrder
    odds?: SortOrder
    grooveScore?: SortOrder
    realProbability?: SortOrder
    impliedProbability?: SortOrder
    valueEdge?: SortOrder
    confidence?: SortOrder
    reason?: SortOrder
    scanDate?: SortOrder
    isActive?: SortOrder
  }

  export type ValueBetScanMinOrderByAggregateInput = {
    id?: SortOrder
    fixtureId?: SortOrder
    pick?: SortOrder
    market?: SortOrder
    odds?: SortOrder
    grooveScore?: SortOrder
    realProbability?: SortOrder
    impliedProbability?: SortOrder
    valueEdge?: SortOrder
    confidence?: SortOrder
    reason?: SortOrder
    scanDate?: SortOrder
    isActive?: SortOrder
  }

  export type ValueBetScanSumOrderByAggregateInput = {
    odds?: SortOrder
    grooveScore?: SortOrder
    realProbability?: SortOrder
    impliedProbability?: SortOrder
    valueEdge?: SortOrder
    confidence?: SortOrder
  }

  export type SlipAnalysisLogCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    slipId?: SortOrder
    totalGames?: SortOrder
    keptGames?: SortOrder
    removedGames?: SortOrder
    replacedGames?: SortOrder
    originalOdds?: SortOrder
    newOdds?: SortOrder
    targetOdds?: SortOrder
    allowSwitching?: SortOrder
    avgGrooveScore?: SortOrder
    analysedAt?: SortOrder
  }

  export type SlipAnalysisLogAvgOrderByAggregateInput = {
    totalGames?: SortOrder
    keptGames?: SortOrder
    removedGames?: SortOrder
    replacedGames?: SortOrder
    originalOdds?: SortOrder
    newOdds?: SortOrder
    targetOdds?: SortOrder
    avgGrooveScore?: SortOrder
  }

  export type SlipAnalysisLogMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    slipId?: SortOrder
    totalGames?: SortOrder
    keptGames?: SortOrder
    removedGames?: SortOrder
    replacedGames?: SortOrder
    originalOdds?: SortOrder
    newOdds?: SortOrder
    targetOdds?: SortOrder
    allowSwitching?: SortOrder
    avgGrooveScore?: SortOrder
    analysedAt?: SortOrder
  }

  export type SlipAnalysisLogMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    slipId?: SortOrder
    totalGames?: SortOrder
    keptGames?: SortOrder
    removedGames?: SortOrder
    replacedGames?: SortOrder
    originalOdds?: SortOrder
    newOdds?: SortOrder
    targetOdds?: SortOrder
    allowSwitching?: SortOrder
    avgGrooveScore?: SortOrder
    analysedAt?: SortOrder
  }

  export type SlipAnalysisLogSumOrderByAggregateInput = {
    totalGames?: SortOrder
    keptGames?: SortOrder
    removedGames?: SortOrder
    replacedGames?: SortOrder
    originalOdds?: SortOrder
    newOdds?: SortOrder
    targetOdds?: SortOrder
    avgGrooveScore?: SortOrder
  }

  export type AccumulatorBuildCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    targetOdds?: SortOrder
    actualOdds?: SortOrder
    riskLevel?: SortOrder
    legsCount?: SortOrder
    avgGrooveScore?: SortOrder
    picks?: SortOrder
    builtAt?: SortOrder
  }

  export type AccumulatorBuildAvgOrderByAggregateInput = {
    targetOdds?: SortOrder
    actualOdds?: SortOrder
    legsCount?: SortOrder
    avgGrooveScore?: SortOrder
  }

  export type AccumulatorBuildMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    targetOdds?: SortOrder
    actualOdds?: SortOrder
    riskLevel?: SortOrder
    legsCount?: SortOrder
    avgGrooveScore?: SortOrder
    builtAt?: SortOrder
  }

  export type AccumulatorBuildMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    targetOdds?: SortOrder
    actualOdds?: SortOrder
    riskLevel?: SortOrder
    legsCount?: SortOrder
    avgGrooveScore?: SortOrder
    builtAt?: SortOrder
  }

  export type AccumulatorBuildSumOrderByAggregateInput = {
    targetOdds?: SortOrder
    actualOdds?: SortOrder
    legsCount?: SortOrder
    avgGrooveScore?: SortOrder
  }

  export type MatchStatisticsCreateNestedOneWithoutFixtureInput = {
    create?: XOR<MatchStatisticsCreateWithoutFixtureInput, MatchStatisticsUncheckedCreateWithoutFixtureInput>
    connectOrCreate?: MatchStatisticsCreateOrConnectWithoutFixtureInput
    connect?: MatchStatisticsWhereUniqueInput
  }

  export type ConfidenceScoreCreateNestedManyWithoutFixtureInput = {
    create?: XOR<ConfidenceScoreCreateWithoutFixtureInput, ConfidenceScoreUncheckedCreateWithoutFixtureInput> | ConfidenceScoreCreateWithoutFixtureInput[] | ConfidenceScoreUncheckedCreateWithoutFixtureInput[]
    connectOrCreate?: ConfidenceScoreCreateOrConnectWithoutFixtureInput | ConfidenceScoreCreateOrConnectWithoutFixtureInput[]
    createMany?: ConfidenceScoreCreateManyFixtureInputEnvelope
    connect?: ConfidenceScoreWhereUniqueInput | ConfidenceScoreWhereUniqueInput[]
  }

  export type ValueBetScanCreateNestedManyWithoutFixtureInput = {
    create?: XOR<ValueBetScanCreateWithoutFixtureInput, ValueBetScanUncheckedCreateWithoutFixtureInput> | ValueBetScanCreateWithoutFixtureInput[] | ValueBetScanUncheckedCreateWithoutFixtureInput[]
    connectOrCreate?: ValueBetScanCreateOrConnectWithoutFixtureInput | ValueBetScanCreateOrConnectWithoutFixtureInput[]
    createMany?: ValueBetScanCreateManyFixtureInputEnvelope
    connect?: ValueBetScanWhereUniqueInput | ValueBetScanWhereUniqueInput[]
  }

  export type MatchStatisticsUncheckedCreateNestedOneWithoutFixtureInput = {
    create?: XOR<MatchStatisticsCreateWithoutFixtureInput, MatchStatisticsUncheckedCreateWithoutFixtureInput>
    connectOrCreate?: MatchStatisticsCreateOrConnectWithoutFixtureInput
    connect?: MatchStatisticsWhereUniqueInput
  }

  export type ConfidenceScoreUncheckedCreateNestedManyWithoutFixtureInput = {
    create?: XOR<ConfidenceScoreCreateWithoutFixtureInput, ConfidenceScoreUncheckedCreateWithoutFixtureInput> | ConfidenceScoreCreateWithoutFixtureInput[] | ConfidenceScoreUncheckedCreateWithoutFixtureInput[]
    connectOrCreate?: ConfidenceScoreCreateOrConnectWithoutFixtureInput | ConfidenceScoreCreateOrConnectWithoutFixtureInput[]
    createMany?: ConfidenceScoreCreateManyFixtureInputEnvelope
    connect?: ConfidenceScoreWhereUniqueInput | ConfidenceScoreWhereUniqueInput[]
  }

  export type ValueBetScanUncheckedCreateNestedManyWithoutFixtureInput = {
    create?: XOR<ValueBetScanCreateWithoutFixtureInput, ValueBetScanUncheckedCreateWithoutFixtureInput> | ValueBetScanCreateWithoutFixtureInput[] | ValueBetScanUncheckedCreateWithoutFixtureInput[]
    connectOrCreate?: ValueBetScanCreateOrConnectWithoutFixtureInput | ValueBetScanCreateOrConnectWithoutFixtureInput[]
    createMany?: ValueBetScanCreateManyFixtureInputEnvelope
    connect?: ValueBetScanWhereUniqueInput | ValueBetScanWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type EnumFixtureStatusFieldUpdateOperationsInput = {
    set?: $Enums.FixtureStatus
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type MatchStatisticsUpdateOneWithoutFixtureNestedInput = {
    create?: XOR<MatchStatisticsCreateWithoutFixtureInput, MatchStatisticsUncheckedCreateWithoutFixtureInput>
    connectOrCreate?: MatchStatisticsCreateOrConnectWithoutFixtureInput
    upsert?: MatchStatisticsUpsertWithoutFixtureInput
    disconnect?: MatchStatisticsWhereInput | boolean
    delete?: MatchStatisticsWhereInput | boolean
    connect?: MatchStatisticsWhereUniqueInput
    update?: XOR<XOR<MatchStatisticsUpdateToOneWithWhereWithoutFixtureInput, MatchStatisticsUpdateWithoutFixtureInput>, MatchStatisticsUncheckedUpdateWithoutFixtureInput>
  }

  export type ConfidenceScoreUpdateManyWithoutFixtureNestedInput = {
    create?: XOR<ConfidenceScoreCreateWithoutFixtureInput, ConfidenceScoreUncheckedCreateWithoutFixtureInput> | ConfidenceScoreCreateWithoutFixtureInput[] | ConfidenceScoreUncheckedCreateWithoutFixtureInput[]
    connectOrCreate?: ConfidenceScoreCreateOrConnectWithoutFixtureInput | ConfidenceScoreCreateOrConnectWithoutFixtureInput[]
    upsert?: ConfidenceScoreUpsertWithWhereUniqueWithoutFixtureInput | ConfidenceScoreUpsertWithWhereUniqueWithoutFixtureInput[]
    createMany?: ConfidenceScoreCreateManyFixtureInputEnvelope
    set?: ConfidenceScoreWhereUniqueInput | ConfidenceScoreWhereUniqueInput[]
    disconnect?: ConfidenceScoreWhereUniqueInput | ConfidenceScoreWhereUniqueInput[]
    delete?: ConfidenceScoreWhereUniqueInput | ConfidenceScoreWhereUniqueInput[]
    connect?: ConfidenceScoreWhereUniqueInput | ConfidenceScoreWhereUniqueInput[]
    update?: ConfidenceScoreUpdateWithWhereUniqueWithoutFixtureInput | ConfidenceScoreUpdateWithWhereUniqueWithoutFixtureInput[]
    updateMany?: ConfidenceScoreUpdateManyWithWhereWithoutFixtureInput | ConfidenceScoreUpdateManyWithWhereWithoutFixtureInput[]
    deleteMany?: ConfidenceScoreScalarWhereInput | ConfidenceScoreScalarWhereInput[]
  }

  export type ValueBetScanUpdateManyWithoutFixtureNestedInput = {
    create?: XOR<ValueBetScanCreateWithoutFixtureInput, ValueBetScanUncheckedCreateWithoutFixtureInput> | ValueBetScanCreateWithoutFixtureInput[] | ValueBetScanUncheckedCreateWithoutFixtureInput[]
    connectOrCreate?: ValueBetScanCreateOrConnectWithoutFixtureInput | ValueBetScanCreateOrConnectWithoutFixtureInput[]
    upsert?: ValueBetScanUpsertWithWhereUniqueWithoutFixtureInput | ValueBetScanUpsertWithWhereUniqueWithoutFixtureInput[]
    createMany?: ValueBetScanCreateManyFixtureInputEnvelope
    set?: ValueBetScanWhereUniqueInput | ValueBetScanWhereUniqueInput[]
    disconnect?: ValueBetScanWhereUniqueInput | ValueBetScanWhereUniqueInput[]
    delete?: ValueBetScanWhereUniqueInput | ValueBetScanWhereUniqueInput[]
    connect?: ValueBetScanWhereUniqueInput | ValueBetScanWhereUniqueInput[]
    update?: ValueBetScanUpdateWithWhereUniqueWithoutFixtureInput | ValueBetScanUpdateWithWhereUniqueWithoutFixtureInput[]
    updateMany?: ValueBetScanUpdateManyWithWhereWithoutFixtureInput | ValueBetScanUpdateManyWithWhereWithoutFixtureInput[]
    deleteMany?: ValueBetScanScalarWhereInput | ValueBetScanScalarWhereInput[]
  }

  export type MatchStatisticsUncheckedUpdateOneWithoutFixtureNestedInput = {
    create?: XOR<MatchStatisticsCreateWithoutFixtureInput, MatchStatisticsUncheckedCreateWithoutFixtureInput>
    connectOrCreate?: MatchStatisticsCreateOrConnectWithoutFixtureInput
    upsert?: MatchStatisticsUpsertWithoutFixtureInput
    disconnect?: MatchStatisticsWhereInput | boolean
    delete?: MatchStatisticsWhereInput | boolean
    connect?: MatchStatisticsWhereUniqueInput
    update?: XOR<XOR<MatchStatisticsUpdateToOneWithWhereWithoutFixtureInput, MatchStatisticsUpdateWithoutFixtureInput>, MatchStatisticsUncheckedUpdateWithoutFixtureInput>
  }

  export type ConfidenceScoreUncheckedUpdateManyWithoutFixtureNestedInput = {
    create?: XOR<ConfidenceScoreCreateWithoutFixtureInput, ConfidenceScoreUncheckedCreateWithoutFixtureInput> | ConfidenceScoreCreateWithoutFixtureInput[] | ConfidenceScoreUncheckedCreateWithoutFixtureInput[]
    connectOrCreate?: ConfidenceScoreCreateOrConnectWithoutFixtureInput | ConfidenceScoreCreateOrConnectWithoutFixtureInput[]
    upsert?: ConfidenceScoreUpsertWithWhereUniqueWithoutFixtureInput | ConfidenceScoreUpsertWithWhereUniqueWithoutFixtureInput[]
    createMany?: ConfidenceScoreCreateManyFixtureInputEnvelope
    set?: ConfidenceScoreWhereUniqueInput | ConfidenceScoreWhereUniqueInput[]
    disconnect?: ConfidenceScoreWhereUniqueInput | ConfidenceScoreWhereUniqueInput[]
    delete?: ConfidenceScoreWhereUniqueInput | ConfidenceScoreWhereUniqueInput[]
    connect?: ConfidenceScoreWhereUniqueInput | ConfidenceScoreWhereUniqueInput[]
    update?: ConfidenceScoreUpdateWithWhereUniqueWithoutFixtureInput | ConfidenceScoreUpdateWithWhereUniqueWithoutFixtureInput[]
    updateMany?: ConfidenceScoreUpdateManyWithWhereWithoutFixtureInput | ConfidenceScoreUpdateManyWithWhereWithoutFixtureInput[]
    deleteMany?: ConfidenceScoreScalarWhereInput | ConfidenceScoreScalarWhereInput[]
  }

  export type ValueBetScanUncheckedUpdateManyWithoutFixtureNestedInput = {
    create?: XOR<ValueBetScanCreateWithoutFixtureInput, ValueBetScanUncheckedCreateWithoutFixtureInput> | ValueBetScanCreateWithoutFixtureInput[] | ValueBetScanUncheckedCreateWithoutFixtureInput[]
    connectOrCreate?: ValueBetScanCreateOrConnectWithoutFixtureInput | ValueBetScanCreateOrConnectWithoutFixtureInput[]
    upsert?: ValueBetScanUpsertWithWhereUniqueWithoutFixtureInput | ValueBetScanUpsertWithWhereUniqueWithoutFixtureInput[]
    createMany?: ValueBetScanCreateManyFixtureInputEnvelope
    set?: ValueBetScanWhereUniqueInput | ValueBetScanWhereUniqueInput[]
    disconnect?: ValueBetScanWhereUniqueInput | ValueBetScanWhereUniqueInput[]
    delete?: ValueBetScanWhereUniqueInput | ValueBetScanWhereUniqueInput[]
    connect?: ValueBetScanWhereUniqueInput | ValueBetScanWhereUniqueInput[]
    update?: ValueBetScanUpdateWithWhereUniqueWithoutFixtureInput | ValueBetScanUpdateWithWhereUniqueWithoutFixtureInput[]
    updateMany?: ValueBetScanUpdateManyWithWhereWithoutFixtureInput | ValueBetScanUpdateManyWithWhereWithoutFixtureInput[]
    deleteMany?: ValueBetScanScalarWhereInput | ValueBetScanScalarWhereInput[]
  }

  export type FixtureCreateNestedOneWithoutStatisticsInput = {
    create?: XOR<FixtureCreateWithoutStatisticsInput, FixtureUncheckedCreateWithoutStatisticsInput>
    connectOrCreate?: FixtureCreateOrConnectWithoutStatisticsInput
    connect?: FixtureWhereUniqueInput
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type FixtureUpdateOneRequiredWithoutStatisticsNestedInput = {
    create?: XOR<FixtureCreateWithoutStatisticsInput, FixtureUncheckedCreateWithoutStatisticsInput>
    connectOrCreate?: FixtureCreateOrConnectWithoutStatisticsInput
    upsert?: FixtureUpsertWithoutStatisticsInput
    connect?: FixtureWhereUniqueInput
    update?: XOR<XOR<FixtureUpdateToOneWithWhereWithoutStatisticsInput, FixtureUpdateWithoutStatisticsInput>, FixtureUncheckedUpdateWithoutStatisticsInput>
  }

  export type FixtureCreateNestedOneWithoutConfidenceScoresInput = {
    create?: XOR<FixtureCreateWithoutConfidenceScoresInput, FixtureUncheckedCreateWithoutConfidenceScoresInput>
    connectOrCreate?: FixtureCreateOrConnectWithoutConfidenceScoresInput
    connect?: FixtureWhereUniqueInput
  }

  export type EnumRiskLevelFieldUpdateOperationsInput = {
    set?: $Enums.RiskLevel
  }

  export type FixtureUpdateOneRequiredWithoutConfidenceScoresNestedInput = {
    create?: XOR<FixtureCreateWithoutConfidenceScoresInput, FixtureUncheckedCreateWithoutConfidenceScoresInput>
    connectOrCreate?: FixtureCreateOrConnectWithoutConfidenceScoresInput
    upsert?: FixtureUpsertWithoutConfidenceScoresInput
    connect?: FixtureWhereUniqueInput
    update?: XOR<XOR<FixtureUpdateToOneWithWhereWithoutConfidenceScoresInput, FixtureUpdateWithoutConfidenceScoresInput>, FixtureUncheckedUpdateWithoutConfidenceScoresInput>
  }

  export type EnumMarketRiskFieldUpdateOperationsInput = {
    set?: $Enums.MarketRisk
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type FixtureCreateNestedOneWithoutValueBetScansInput = {
    create?: XOR<FixtureCreateWithoutValueBetScansInput, FixtureUncheckedCreateWithoutValueBetScansInput>
    connectOrCreate?: FixtureCreateOrConnectWithoutValueBetScansInput
    connect?: FixtureWhereUniqueInput
  }

  export type FixtureUpdateOneRequiredWithoutValueBetScansNestedInput = {
    create?: XOR<FixtureCreateWithoutValueBetScansInput, FixtureUncheckedCreateWithoutValueBetScansInput>
    connectOrCreate?: FixtureCreateOrConnectWithoutValueBetScansInput
    upsert?: FixtureUpsertWithoutValueBetScansInput
    connect?: FixtureWhereUniqueInput
    update?: XOR<XOR<FixtureUpdateToOneWithWhereWithoutValueBetScansInput, FixtureUpdateWithoutValueBetScansInput>, FixtureUncheckedUpdateWithoutValueBetScansInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedEnumFixtureStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.FixtureStatus | EnumFixtureStatusFieldRefInput<$PrismaModel>
    in?: $Enums.FixtureStatus[] | ListEnumFixtureStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.FixtureStatus[] | ListEnumFixtureStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumFixtureStatusFilter<$PrismaModel> | $Enums.FixtureStatus
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumFixtureStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FixtureStatus | EnumFixtureStatusFieldRefInput<$PrismaModel>
    in?: $Enums.FixtureStatus[] | ListEnumFixtureStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.FixtureStatus[] | ListEnumFixtureStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumFixtureStatusWithAggregatesFilter<$PrismaModel> | $Enums.FixtureStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumFixtureStatusFilter<$PrismaModel>
    _max?: NestedEnumFixtureStatusFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type NestedEnumRiskLevelFilter<$PrismaModel = never> = {
    equals?: $Enums.RiskLevel | EnumRiskLevelFieldRefInput<$PrismaModel>
    in?: $Enums.RiskLevel[] | ListEnumRiskLevelFieldRefInput<$PrismaModel>
    notIn?: $Enums.RiskLevel[] | ListEnumRiskLevelFieldRefInput<$PrismaModel>
    not?: NestedEnumRiskLevelFilter<$PrismaModel> | $Enums.RiskLevel
  }

  export type NestedEnumRiskLevelWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RiskLevel | EnumRiskLevelFieldRefInput<$PrismaModel>
    in?: $Enums.RiskLevel[] | ListEnumRiskLevelFieldRefInput<$PrismaModel>
    notIn?: $Enums.RiskLevel[] | ListEnumRiskLevelFieldRefInput<$PrismaModel>
    not?: NestedEnumRiskLevelWithAggregatesFilter<$PrismaModel> | $Enums.RiskLevel
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRiskLevelFilter<$PrismaModel>
    _max?: NestedEnumRiskLevelFilter<$PrismaModel>
  }

  export type NestedEnumMarketRiskFilter<$PrismaModel = never> = {
    equals?: $Enums.MarketRisk | EnumMarketRiskFieldRefInput<$PrismaModel>
    in?: $Enums.MarketRisk[] | ListEnumMarketRiskFieldRefInput<$PrismaModel>
    notIn?: $Enums.MarketRisk[] | ListEnumMarketRiskFieldRefInput<$PrismaModel>
    not?: NestedEnumMarketRiskFilter<$PrismaModel> | $Enums.MarketRisk
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedEnumMarketRiskWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MarketRisk | EnumMarketRiskFieldRefInput<$PrismaModel>
    in?: $Enums.MarketRisk[] | ListEnumMarketRiskFieldRefInput<$PrismaModel>
    notIn?: $Enums.MarketRisk[] | ListEnumMarketRiskFieldRefInput<$PrismaModel>
    not?: NestedEnumMarketRiskWithAggregatesFilter<$PrismaModel> | $Enums.MarketRisk
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMarketRiskFilter<$PrismaModel>
    _max?: NestedEnumMarketRiskFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type MatchStatisticsCreateWithoutFixtureInput = {
    id?: string
    homeFormString?: string | null
    homeWins?: number
    homeDraws?: number
    homeLosses?: number
    homeGoalsScored?: number
    homeGoalsConceded?: number
    homeAvgScored?: number
    homeAvgConceded?: number
    awayFormString?: string | null
    awayWins?: number
    awayDraws?: number
    awayLosses?: number
    awayGoalsScored?: number
    awayGoalsConceded?: number
    awayAvgScored?: number
    awayAvgConceded?: number
    probHome?: number
    probDraw?: number
    probAway?: number
    predictedResult?: string | null
    over15Rate?: number
    over25Rate?: number
    bttsRate?: number
    xGHome?: number | null
    xGAway?: number | null
    homeInjuredCount?: number
    awayInjuredCount?: number
    oddsHome?: number | null
    oddsDraw?: number | null
    oddsAway?: number | null
    dataSource?: string
    fetchedAt?: Date | string
    updatedAt?: Date | string
  }

  export type MatchStatisticsUncheckedCreateWithoutFixtureInput = {
    id?: string
    homeFormString?: string | null
    homeWins?: number
    homeDraws?: number
    homeLosses?: number
    homeGoalsScored?: number
    homeGoalsConceded?: number
    homeAvgScored?: number
    homeAvgConceded?: number
    awayFormString?: string | null
    awayWins?: number
    awayDraws?: number
    awayLosses?: number
    awayGoalsScored?: number
    awayGoalsConceded?: number
    awayAvgScored?: number
    awayAvgConceded?: number
    probHome?: number
    probDraw?: number
    probAway?: number
    predictedResult?: string | null
    over15Rate?: number
    over25Rate?: number
    bttsRate?: number
    xGHome?: number | null
    xGAway?: number | null
    homeInjuredCount?: number
    awayInjuredCount?: number
    oddsHome?: number | null
    oddsDraw?: number | null
    oddsAway?: number | null
    dataSource?: string
    fetchedAt?: Date | string
    updatedAt?: Date | string
  }

  export type MatchStatisticsCreateOrConnectWithoutFixtureInput = {
    where: MatchStatisticsWhereUniqueInput
    create: XOR<MatchStatisticsCreateWithoutFixtureInput, MatchStatisticsUncheckedCreateWithoutFixtureInput>
  }

  export type ConfidenceScoreCreateWithoutFixtureInput = {
    id?: string
    pick: string
    market: string
    formScore?: number
    homeAwayScore?: number
    h2hScore?: number
    goalTrendScore?: number
    oddsScore?: number
    teamStrengthScore?: number
    grooveScore?: number
    riskLevel?: $Enums.RiskLevel
    confidence?: number
    impliedProbability?: number
    realProbability?: number
    valueEdge?: number
    calculatedAt?: Date | string
  }

  export type ConfidenceScoreUncheckedCreateWithoutFixtureInput = {
    id?: string
    pick: string
    market: string
    formScore?: number
    homeAwayScore?: number
    h2hScore?: number
    goalTrendScore?: number
    oddsScore?: number
    teamStrengthScore?: number
    grooveScore?: number
    riskLevel?: $Enums.RiskLevel
    confidence?: number
    impliedProbability?: number
    realProbability?: number
    valueEdge?: number
    calculatedAt?: Date | string
  }

  export type ConfidenceScoreCreateOrConnectWithoutFixtureInput = {
    where: ConfidenceScoreWhereUniqueInput
    create: XOR<ConfidenceScoreCreateWithoutFixtureInput, ConfidenceScoreUncheckedCreateWithoutFixtureInput>
  }

  export type ConfidenceScoreCreateManyFixtureInputEnvelope = {
    data: ConfidenceScoreCreateManyFixtureInput | ConfidenceScoreCreateManyFixtureInput[]
    skipDuplicates?: boolean
  }

  export type ValueBetScanCreateWithoutFixtureInput = {
    id?: string
    pick: string
    market: string
    odds: number
    grooveScore: number
    realProbability: number
    impliedProbability: number
    valueEdge: number
    confidence: number
    reason: string
    scanDate?: Date | string
    isActive?: boolean
  }

  export type ValueBetScanUncheckedCreateWithoutFixtureInput = {
    id?: string
    pick: string
    market: string
    odds: number
    grooveScore: number
    realProbability: number
    impliedProbability: number
    valueEdge: number
    confidence: number
    reason: string
    scanDate?: Date | string
    isActive?: boolean
  }

  export type ValueBetScanCreateOrConnectWithoutFixtureInput = {
    where: ValueBetScanWhereUniqueInput
    create: XOR<ValueBetScanCreateWithoutFixtureInput, ValueBetScanUncheckedCreateWithoutFixtureInput>
  }

  export type ValueBetScanCreateManyFixtureInputEnvelope = {
    data: ValueBetScanCreateManyFixtureInput | ValueBetScanCreateManyFixtureInput[]
    skipDuplicates?: boolean
  }

  export type MatchStatisticsUpsertWithoutFixtureInput = {
    update: XOR<MatchStatisticsUpdateWithoutFixtureInput, MatchStatisticsUncheckedUpdateWithoutFixtureInput>
    create: XOR<MatchStatisticsCreateWithoutFixtureInput, MatchStatisticsUncheckedCreateWithoutFixtureInput>
    where?: MatchStatisticsWhereInput
  }

  export type MatchStatisticsUpdateToOneWithWhereWithoutFixtureInput = {
    where?: MatchStatisticsWhereInput
    data: XOR<MatchStatisticsUpdateWithoutFixtureInput, MatchStatisticsUncheckedUpdateWithoutFixtureInput>
  }

  export type MatchStatisticsUpdateWithoutFixtureInput = {
    id?: StringFieldUpdateOperationsInput | string
    homeFormString?: NullableStringFieldUpdateOperationsInput | string | null
    homeWins?: IntFieldUpdateOperationsInput | number
    homeDraws?: IntFieldUpdateOperationsInput | number
    homeLosses?: IntFieldUpdateOperationsInput | number
    homeGoalsScored?: IntFieldUpdateOperationsInput | number
    homeGoalsConceded?: IntFieldUpdateOperationsInput | number
    homeAvgScored?: FloatFieldUpdateOperationsInput | number
    homeAvgConceded?: FloatFieldUpdateOperationsInput | number
    awayFormString?: NullableStringFieldUpdateOperationsInput | string | null
    awayWins?: IntFieldUpdateOperationsInput | number
    awayDraws?: IntFieldUpdateOperationsInput | number
    awayLosses?: IntFieldUpdateOperationsInput | number
    awayGoalsScored?: IntFieldUpdateOperationsInput | number
    awayGoalsConceded?: IntFieldUpdateOperationsInput | number
    awayAvgScored?: FloatFieldUpdateOperationsInput | number
    awayAvgConceded?: FloatFieldUpdateOperationsInput | number
    probHome?: FloatFieldUpdateOperationsInput | number
    probDraw?: FloatFieldUpdateOperationsInput | number
    probAway?: FloatFieldUpdateOperationsInput | number
    predictedResult?: NullableStringFieldUpdateOperationsInput | string | null
    over15Rate?: FloatFieldUpdateOperationsInput | number
    over25Rate?: FloatFieldUpdateOperationsInput | number
    bttsRate?: FloatFieldUpdateOperationsInput | number
    xGHome?: NullableFloatFieldUpdateOperationsInput | number | null
    xGAway?: NullableFloatFieldUpdateOperationsInput | number | null
    homeInjuredCount?: IntFieldUpdateOperationsInput | number
    awayInjuredCount?: IntFieldUpdateOperationsInput | number
    oddsHome?: NullableFloatFieldUpdateOperationsInput | number | null
    oddsDraw?: NullableFloatFieldUpdateOperationsInput | number | null
    oddsAway?: NullableFloatFieldUpdateOperationsInput | number | null
    dataSource?: StringFieldUpdateOperationsInput | string
    fetchedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MatchStatisticsUncheckedUpdateWithoutFixtureInput = {
    id?: StringFieldUpdateOperationsInput | string
    homeFormString?: NullableStringFieldUpdateOperationsInput | string | null
    homeWins?: IntFieldUpdateOperationsInput | number
    homeDraws?: IntFieldUpdateOperationsInput | number
    homeLosses?: IntFieldUpdateOperationsInput | number
    homeGoalsScored?: IntFieldUpdateOperationsInput | number
    homeGoalsConceded?: IntFieldUpdateOperationsInput | number
    homeAvgScored?: FloatFieldUpdateOperationsInput | number
    homeAvgConceded?: FloatFieldUpdateOperationsInput | number
    awayFormString?: NullableStringFieldUpdateOperationsInput | string | null
    awayWins?: IntFieldUpdateOperationsInput | number
    awayDraws?: IntFieldUpdateOperationsInput | number
    awayLosses?: IntFieldUpdateOperationsInput | number
    awayGoalsScored?: IntFieldUpdateOperationsInput | number
    awayGoalsConceded?: IntFieldUpdateOperationsInput | number
    awayAvgScored?: FloatFieldUpdateOperationsInput | number
    awayAvgConceded?: FloatFieldUpdateOperationsInput | number
    probHome?: FloatFieldUpdateOperationsInput | number
    probDraw?: FloatFieldUpdateOperationsInput | number
    probAway?: FloatFieldUpdateOperationsInput | number
    predictedResult?: NullableStringFieldUpdateOperationsInput | string | null
    over15Rate?: FloatFieldUpdateOperationsInput | number
    over25Rate?: FloatFieldUpdateOperationsInput | number
    bttsRate?: FloatFieldUpdateOperationsInput | number
    xGHome?: NullableFloatFieldUpdateOperationsInput | number | null
    xGAway?: NullableFloatFieldUpdateOperationsInput | number | null
    homeInjuredCount?: IntFieldUpdateOperationsInput | number
    awayInjuredCount?: IntFieldUpdateOperationsInput | number
    oddsHome?: NullableFloatFieldUpdateOperationsInput | number | null
    oddsDraw?: NullableFloatFieldUpdateOperationsInput | number | null
    oddsAway?: NullableFloatFieldUpdateOperationsInput | number | null
    dataSource?: StringFieldUpdateOperationsInput | string
    fetchedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConfidenceScoreUpsertWithWhereUniqueWithoutFixtureInput = {
    where: ConfidenceScoreWhereUniqueInput
    update: XOR<ConfidenceScoreUpdateWithoutFixtureInput, ConfidenceScoreUncheckedUpdateWithoutFixtureInput>
    create: XOR<ConfidenceScoreCreateWithoutFixtureInput, ConfidenceScoreUncheckedCreateWithoutFixtureInput>
  }

  export type ConfidenceScoreUpdateWithWhereUniqueWithoutFixtureInput = {
    where: ConfidenceScoreWhereUniqueInput
    data: XOR<ConfidenceScoreUpdateWithoutFixtureInput, ConfidenceScoreUncheckedUpdateWithoutFixtureInput>
  }

  export type ConfidenceScoreUpdateManyWithWhereWithoutFixtureInput = {
    where: ConfidenceScoreScalarWhereInput
    data: XOR<ConfidenceScoreUpdateManyMutationInput, ConfidenceScoreUncheckedUpdateManyWithoutFixtureInput>
  }

  export type ConfidenceScoreScalarWhereInput = {
    AND?: ConfidenceScoreScalarWhereInput | ConfidenceScoreScalarWhereInput[]
    OR?: ConfidenceScoreScalarWhereInput[]
    NOT?: ConfidenceScoreScalarWhereInput | ConfidenceScoreScalarWhereInput[]
    id?: StringFilter<"ConfidenceScore"> | string
    fixtureId?: StringFilter<"ConfidenceScore"> | string
    pick?: StringFilter<"ConfidenceScore"> | string
    market?: StringFilter<"ConfidenceScore"> | string
    formScore?: FloatFilter<"ConfidenceScore"> | number
    homeAwayScore?: FloatFilter<"ConfidenceScore"> | number
    h2hScore?: FloatFilter<"ConfidenceScore"> | number
    goalTrendScore?: FloatFilter<"ConfidenceScore"> | number
    oddsScore?: FloatFilter<"ConfidenceScore"> | number
    teamStrengthScore?: FloatFilter<"ConfidenceScore"> | number
    grooveScore?: FloatFilter<"ConfidenceScore"> | number
    riskLevel?: EnumRiskLevelFilter<"ConfidenceScore"> | $Enums.RiskLevel
    confidence?: IntFilter<"ConfidenceScore"> | number
    impliedProbability?: FloatFilter<"ConfidenceScore"> | number
    realProbability?: FloatFilter<"ConfidenceScore"> | number
    valueEdge?: FloatFilter<"ConfidenceScore"> | number
    calculatedAt?: DateTimeFilter<"ConfidenceScore"> | Date | string
  }

  export type ValueBetScanUpsertWithWhereUniqueWithoutFixtureInput = {
    where: ValueBetScanWhereUniqueInput
    update: XOR<ValueBetScanUpdateWithoutFixtureInput, ValueBetScanUncheckedUpdateWithoutFixtureInput>
    create: XOR<ValueBetScanCreateWithoutFixtureInput, ValueBetScanUncheckedCreateWithoutFixtureInput>
  }

  export type ValueBetScanUpdateWithWhereUniqueWithoutFixtureInput = {
    where: ValueBetScanWhereUniqueInput
    data: XOR<ValueBetScanUpdateWithoutFixtureInput, ValueBetScanUncheckedUpdateWithoutFixtureInput>
  }

  export type ValueBetScanUpdateManyWithWhereWithoutFixtureInput = {
    where: ValueBetScanScalarWhereInput
    data: XOR<ValueBetScanUpdateManyMutationInput, ValueBetScanUncheckedUpdateManyWithoutFixtureInput>
  }

  export type ValueBetScanScalarWhereInput = {
    AND?: ValueBetScanScalarWhereInput | ValueBetScanScalarWhereInput[]
    OR?: ValueBetScanScalarWhereInput[]
    NOT?: ValueBetScanScalarWhereInput | ValueBetScanScalarWhereInput[]
    id?: StringFilter<"ValueBetScan"> | string
    fixtureId?: StringFilter<"ValueBetScan"> | string
    pick?: StringFilter<"ValueBetScan"> | string
    market?: StringFilter<"ValueBetScan"> | string
    odds?: FloatFilter<"ValueBetScan"> | number
    grooveScore?: FloatFilter<"ValueBetScan"> | number
    realProbability?: FloatFilter<"ValueBetScan"> | number
    impliedProbability?: FloatFilter<"ValueBetScan"> | number
    valueEdge?: FloatFilter<"ValueBetScan"> | number
    confidence?: IntFilter<"ValueBetScan"> | number
    reason?: StringFilter<"ValueBetScan"> | string
    scanDate?: DateTimeFilter<"ValueBetScan"> | Date | string
    isActive?: BoolFilter<"ValueBetScan"> | boolean
  }

  export type FixtureCreateWithoutStatisticsInput = {
    id?: string
    fixtureId: string
    homeTeam: string
    awayTeam: string
    homeTeamId: string
    awayTeamId: string
    league: string
    leagueId: string
    country: string
    matchDate: Date | string
    status?: $Enums.FixtureStatus
    homeScore?: number | null
    awayScore?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    confidenceScores?: ConfidenceScoreCreateNestedManyWithoutFixtureInput
    valueBetScans?: ValueBetScanCreateNestedManyWithoutFixtureInput
  }

  export type FixtureUncheckedCreateWithoutStatisticsInput = {
    id?: string
    fixtureId: string
    homeTeam: string
    awayTeam: string
    homeTeamId: string
    awayTeamId: string
    league: string
    leagueId: string
    country: string
    matchDate: Date | string
    status?: $Enums.FixtureStatus
    homeScore?: number | null
    awayScore?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    confidenceScores?: ConfidenceScoreUncheckedCreateNestedManyWithoutFixtureInput
    valueBetScans?: ValueBetScanUncheckedCreateNestedManyWithoutFixtureInput
  }

  export type FixtureCreateOrConnectWithoutStatisticsInput = {
    where: FixtureWhereUniqueInput
    create: XOR<FixtureCreateWithoutStatisticsInput, FixtureUncheckedCreateWithoutStatisticsInput>
  }

  export type FixtureUpsertWithoutStatisticsInput = {
    update: XOR<FixtureUpdateWithoutStatisticsInput, FixtureUncheckedUpdateWithoutStatisticsInput>
    create: XOR<FixtureCreateWithoutStatisticsInput, FixtureUncheckedCreateWithoutStatisticsInput>
    where?: FixtureWhereInput
  }

  export type FixtureUpdateToOneWithWhereWithoutStatisticsInput = {
    where?: FixtureWhereInput
    data: XOR<FixtureUpdateWithoutStatisticsInput, FixtureUncheckedUpdateWithoutStatisticsInput>
  }

  export type FixtureUpdateWithoutStatisticsInput = {
    id?: StringFieldUpdateOperationsInput | string
    fixtureId?: StringFieldUpdateOperationsInput | string
    homeTeam?: StringFieldUpdateOperationsInput | string
    awayTeam?: StringFieldUpdateOperationsInput | string
    homeTeamId?: StringFieldUpdateOperationsInput | string
    awayTeamId?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    leagueId?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    matchDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumFixtureStatusFieldUpdateOperationsInput | $Enums.FixtureStatus
    homeScore?: NullableIntFieldUpdateOperationsInput | number | null
    awayScore?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    confidenceScores?: ConfidenceScoreUpdateManyWithoutFixtureNestedInput
    valueBetScans?: ValueBetScanUpdateManyWithoutFixtureNestedInput
  }

  export type FixtureUncheckedUpdateWithoutStatisticsInput = {
    id?: StringFieldUpdateOperationsInput | string
    fixtureId?: StringFieldUpdateOperationsInput | string
    homeTeam?: StringFieldUpdateOperationsInput | string
    awayTeam?: StringFieldUpdateOperationsInput | string
    homeTeamId?: StringFieldUpdateOperationsInput | string
    awayTeamId?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    leagueId?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    matchDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumFixtureStatusFieldUpdateOperationsInput | $Enums.FixtureStatus
    homeScore?: NullableIntFieldUpdateOperationsInput | number | null
    awayScore?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    confidenceScores?: ConfidenceScoreUncheckedUpdateManyWithoutFixtureNestedInput
    valueBetScans?: ValueBetScanUncheckedUpdateManyWithoutFixtureNestedInput
  }

  export type FixtureCreateWithoutConfidenceScoresInput = {
    id?: string
    fixtureId: string
    homeTeam: string
    awayTeam: string
    homeTeamId: string
    awayTeamId: string
    league: string
    leagueId: string
    country: string
    matchDate: Date | string
    status?: $Enums.FixtureStatus
    homeScore?: number | null
    awayScore?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    statistics?: MatchStatisticsCreateNestedOneWithoutFixtureInput
    valueBetScans?: ValueBetScanCreateNestedManyWithoutFixtureInput
  }

  export type FixtureUncheckedCreateWithoutConfidenceScoresInput = {
    id?: string
    fixtureId: string
    homeTeam: string
    awayTeam: string
    homeTeamId: string
    awayTeamId: string
    league: string
    leagueId: string
    country: string
    matchDate: Date | string
    status?: $Enums.FixtureStatus
    homeScore?: number | null
    awayScore?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    statistics?: MatchStatisticsUncheckedCreateNestedOneWithoutFixtureInput
    valueBetScans?: ValueBetScanUncheckedCreateNestedManyWithoutFixtureInput
  }

  export type FixtureCreateOrConnectWithoutConfidenceScoresInput = {
    where: FixtureWhereUniqueInput
    create: XOR<FixtureCreateWithoutConfidenceScoresInput, FixtureUncheckedCreateWithoutConfidenceScoresInput>
  }

  export type FixtureUpsertWithoutConfidenceScoresInput = {
    update: XOR<FixtureUpdateWithoutConfidenceScoresInput, FixtureUncheckedUpdateWithoutConfidenceScoresInput>
    create: XOR<FixtureCreateWithoutConfidenceScoresInput, FixtureUncheckedCreateWithoutConfidenceScoresInput>
    where?: FixtureWhereInput
  }

  export type FixtureUpdateToOneWithWhereWithoutConfidenceScoresInput = {
    where?: FixtureWhereInput
    data: XOR<FixtureUpdateWithoutConfidenceScoresInput, FixtureUncheckedUpdateWithoutConfidenceScoresInput>
  }

  export type FixtureUpdateWithoutConfidenceScoresInput = {
    id?: StringFieldUpdateOperationsInput | string
    fixtureId?: StringFieldUpdateOperationsInput | string
    homeTeam?: StringFieldUpdateOperationsInput | string
    awayTeam?: StringFieldUpdateOperationsInput | string
    homeTeamId?: StringFieldUpdateOperationsInput | string
    awayTeamId?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    leagueId?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    matchDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumFixtureStatusFieldUpdateOperationsInput | $Enums.FixtureStatus
    homeScore?: NullableIntFieldUpdateOperationsInput | number | null
    awayScore?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    statistics?: MatchStatisticsUpdateOneWithoutFixtureNestedInput
    valueBetScans?: ValueBetScanUpdateManyWithoutFixtureNestedInput
  }

  export type FixtureUncheckedUpdateWithoutConfidenceScoresInput = {
    id?: StringFieldUpdateOperationsInput | string
    fixtureId?: StringFieldUpdateOperationsInput | string
    homeTeam?: StringFieldUpdateOperationsInput | string
    awayTeam?: StringFieldUpdateOperationsInput | string
    homeTeamId?: StringFieldUpdateOperationsInput | string
    awayTeamId?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    leagueId?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    matchDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumFixtureStatusFieldUpdateOperationsInput | $Enums.FixtureStatus
    homeScore?: NullableIntFieldUpdateOperationsInput | number | null
    awayScore?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    statistics?: MatchStatisticsUncheckedUpdateOneWithoutFixtureNestedInput
    valueBetScans?: ValueBetScanUncheckedUpdateManyWithoutFixtureNestedInput
  }

  export type FixtureCreateWithoutValueBetScansInput = {
    id?: string
    fixtureId: string
    homeTeam: string
    awayTeam: string
    homeTeamId: string
    awayTeamId: string
    league: string
    leagueId: string
    country: string
    matchDate: Date | string
    status?: $Enums.FixtureStatus
    homeScore?: number | null
    awayScore?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    statistics?: MatchStatisticsCreateNestedOneWithoutFixtureInput
    confidenceScores?: ConfidenceScoreCreateNestedManyWithoutFixtureInput
  }

  export type FixtureUncheckedCreateWithoutValueBetScansInput = {
    id?: string
    fixtureId: string
    homeTeam: string
    awayTeam: string
    homeTeamId: string
    awayTeamId: string
    league: string
    leagueId: string
    country: string
    matchDate: Date | string
    status?: $Enums.FixtureStatus
    homeScore?: number | null
    awayScore?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    statistics?: MatchStatisticsUncheckedCreateNestedOneWithoutFixtureInput
    confidenceScores?: ConfidenceScoreUncheckedCreateNestedManyWithoutFixtureInput
  }

  export type FixtureCreateOrConnectWithoutValueBetScansInput = {
    where: FixtureWhereUniqueInput
    create: XOR<FixtureCreateWithoutValueBetScansInput, FixtureUncheckedCreateWithoutValueBetScansInput>
  }

  export type FixtureUpsertWithoutValueBetScansInput = {
    update: XOR<FixtureUpdateWithoutValueBetScansInput, FixtureUncheckedUpdateWithoutValueBetScansInput>
    create: XOR<FixtureCreateWithoutValueBetScansInput, FixtureUncheckedCreateWithoutValueBetScansInput>
    where?: FixtureWhereInput
  }

  export type FixtureUpdateToOneWithWhereWithoutValueBetScansInput = {
    where?: FixtureWhereInput
    data: XOR<FixtureUpdateWithoutValueBetScansInput, FixtureUncheckedUpdateWithoutValueBetScansInput>
  }

  export type FixtureUpdateWithoutValueBetScansInput = {
    id?: StringFieldUpdateOperationsInput | string
    fixtureId?: StringFieldUpdateOperationsInput | string
    homeTeam?: StringFieldUpdateOperationsInput | string
    awayTeam?: StringFieldUpdateOperationsInput | string
    homeTeamId?: StringFieldUpdateOperationsInput | string
    awayTeamId?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    leagueId?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    matchDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumFixtureStatusFieldUpdateOperationsInput | $Enums.FixtureStatus
    homeScore?: NullableIntFieldUpdateOperationsInput | number | null
    awayScore?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    statistics?: MatchStatisticsUpdateOneWithoutFixtureNestedInput
    confidenceScores?: ConfidenceScoreUpdateManyWithoutFixtureNestedInput
  }

  export type FixtureUncheckedUpdateWithoutValueBetScansInput = {
    id?: StringFieldUpdateOperationsInput | string
    fixtureId?: StringFieldUpdateOperationsInput | string
    homeTeam?: StringFieldUpdateOperationsInput | string
    awayTeam?: StringFieldUpdateOperationsInput | string
    homeTeamId?: StringFieldUpdateOperationsInput | string
    awayTeamId?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    leagueId?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    matchDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumFixtureStatusFieldUpdateOperationsInput | $Enums.FixtureStatus
    homeScore?: NullableIntFieldUpdateOperationsInput | number | null
    awayScore?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    statistics?: MatchStatisticsUncheckedUpdateOneWithoutFixtureNestedInput
    confidenceScores?: ConfidenceScoreUncheckedUpdateManyWithoutFixtureNestedInput
  }

  export type ConfidenceScoreCreateManyFixtureInput = {
    id?: string
    pick: string
    market: string
    formScore?: number
    homeAwayScore?: number
    h2hScore?: number
    goalTrendScore?: number
    oddsScore?: number
    teamStrengthScore?: number
    grooveScore?: number
    riskLevel?: $Enums.RiskLevel
    confidence?: number
    impliedProbability?: number
    realProbability?: number
    valueEdge?: number
    calculatedAt?: Date | string
  }

  export type ValueBetScanCreateManyFixtureInput = {
    id?: string
    pick: string
    market: string
    odds: number
    grooveScore: number
    realProbability: number
    impliedProbability: number
    valueEdge: number
    confidence: number
    reason: string
    scanDate?: Date | string
    isActive?: boolean
  }

  export type ConfidenceScoreUpdateWithoutFixtureInput = {
    id?: StringFieldUpdateOperationsInput | string
    pick?: StringFieldUpdateOperationsInput | string
    market?: StringFieldUpdateOperationsInput | string
    formScore?: FloatFieldUpdateOperationsInput | number
    homeAwayScore?: FloatFieldUpdateOperationsInput | number
    h2hScore?: FloatFieldUpdateOperationsInput | number
    goalTrendScore?: FloatFieldUpdateOperationsInput | number
    oddsScore?: FloatFieldUpdateOperationsInput | number
    teamStrengthScore?: FloatFieldUpdateOperationsInput | number
    grooveScore?: FloatFieldUpdateOperationsInput | number
    riskLevel?: EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel
    confidence?: IntFieldUpdateOperationsInput | number
    impliedProbability?: FloatFieldUpdateOperationsInput | number
    realProbability?: FloatFieldUpdateOperationsInput | number
    valueEdge?: FloatFieldUpdateOperationsInput | number
    calculatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConfidenceScoreUncheckedUpdateWithoutFixtureInput = {
    id?: StringFieldUpdateOperationsInput | string
    pick?: StringFieldUpdateOperationsInput | string
    market?: StringFieldUpdateOperationsInput | string
    formScore?: FloatFieldUpdateOperationsInput | number
    homeAwayScore?: FloatFieldUpdateOperationsInput | number
    h2hScore?: FloatFieldUpdateOperationsInput | number
    goalTrendScore?: FloatFieldUpdateOperationsInput | number
    oddsScore?: FloatFieldUpdateOperationsInput | number
    teamStrengthScore?: FloatFieldUpdateOperationsInput | number
    grooveScore?: FloatFieldUpdateOperationsInput | number
    riskLevel?: EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel
    confidence?: IntFieldUpdateOperationsInput | number
    impliedProbability?: FloatFieldUpdateOperationsInput | number
    realProbability?: FloatFieldUpdateOperationsInput | number
    valueEdge?: FloatFieldUpdateOperationsInput | number
    calculatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConfidenceScoreUncheckedUpdateManyWithoutFixtureInput = {
    id?: StringFieldUpdateOperationsInput | string
    pick?: StringFieldUpdateOperationsInput | string
    market?: StringFieldUpdateOperationsInput | string
    formScore?: FloatFieldUpdateOperationsInput | number
    homeAwayScore?: FloatFieldUpdateOperationsInput | number
    h2hScore?: FloatFieldUpdateOperationsInput | number
    goalTrendScore?: FloatFieldUpdateOperationsInput | number
    oddsScore?: FloatFieldUpdateOperationsInput | number
    teamStrengthScore?: FloatFieldUpdateOperationsInput | number
    grooveScore?: FloatFieldUpdateOperationsInput | number
    riskLevel?: EnumRiskLevelFieldUpdateOperationsInput | $Enums.RiskLevel
    confidence?: IntFieldUpdateOperationsInput | number
    impliedProbability?: FloatFieldUpdateOperationsInput | number
    realProbability?: FloatFieldUpdateOperationsInput | number
    valueEdge?: FloatFieldUpdateOperationsInput | number
    calculatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ValueBetScanUpdateWithoutFixtureInput = {
    id?: StringFieldUpdateOperationsInput | string
    pick?: StringFieldUpdateOperationsInput | string
    market?: StringFieldUpdateOperationsInput | string
    odds?: FloatFieldUpdateOperationsInput | number
    grooveScore?: FloatFieldUpdateOperationsInput | number
    realProbability?: FloatFieldUpdateOperationsInput | number
    impliedProbability?: FloatFieldUpdateOperationsInput | number
    valueEdge?: FloatFieldUpdateOperationsInput | number
    confidence?: IntFieldUpdateOperationsInput | number
    reason?: StringFieldUpdateOperationsInput | string
    scanDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
  }

  export type ValueBetScanUncheckedUpdateWithoutFixtureInput = {
    id?: StringFieldUpdateOperationsInput | string
    pick?: StringFieldUpdateOperationsInput | string
    market?: StringFieldUpdateOperationsInput | string
    odds?: FloatFieldUpdateOperationsInput | number
    grooveScore?: FloatFieldUpdateOperationsInput | number
    realProbability?: FloatFieldUpdateOperationsInput | number
    impliedProbability?: FloatFieldUpdateOperationsInput | number
    valueEdge?: FloatFieldUpdateOperationsInput | number
    confidence?: IntFieldUpdateOperationsInput | number
    reason?: StringFieldUpdateOperationsInput | string
    scanDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
  }

  export type ValueBetScanUncheckedUpdateManyWithoutFixtureInput = {
    id?: StringFieldUpdateOperationsInput | string
    pick?: StringFieldUpdateOperationsInput | string
    market?: StringFieldUpdateOperationsInput | string
    odds?: FloatFieldUpdateOperationsInput | number
    grooveScore?: FloatFieldUpdateOperationsInput | number
    realProbability?: FloatFieldUpdateOperationsInput | number
    impliedProbability?: FloatFieldUpdateOperationsInput | number
    valueEdge?: FloatFieldUpdateOperationsInput | number
    confidence?: IntFieldUpdateOperationsInput | number
    reason?: StringFieldUpdateOperationsInput | string
    scanDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}