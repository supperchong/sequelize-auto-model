// import { DataTypes, Sequelize } from 'sequelize'
// import { Sequelize, DataTypes } from 'sequelize'
const { Sequelize, DataTypes } = require('sequelize')
import sequelizeSpy from './sequelizeSpy'
import { readdirSync } from 'fs'
import * as path from 'path'
import QueryInterfaceSpy from './QueryInterfaceSpy.js'
import * as sinon from 'sinon'
// const DataTypes = Sequelize.DataTypes
const migrationRegExp = /^\d{14}.*?\.js$/
const isMigrationPath: (path: string) => boolean = path => migrationRegExp.test(path)
const resolvePath: (dir: string) => (p: string) => string = dir => p => path.resolve(dir, p)
const ignorePathFilter: (ignorePath: string[]) => (p: string) => boolean = ignorePath => p => !ignorePath.find(v => v === p)
export interface Config {
  migrationDir: string;
  ignoreMigration: string[],
  modelDir: string;
}
class Migration {
  public config: Config;
  private _migrationPath: string[]
  private _queryInterfaceSpy: QueryInterfaceSpy
  constructor(config: Config) {
    this.config = config;
    this._init()
  }
  private _init() {
    this._normalizePath()
  }
  private _normalizePath() {
    const { migrationDir, ignoreMigration = [] } = this.config
    const paths = readdirSync(migrationDir)
      .filter(isMigrationPath)
      .filter(ignorePathFilter(ignoreMigration))
      .map(resolvePath(migrationDir))
    this._migrationPath = paths
  }
  public get migrationPath() {
    return this._migrationPath
  }
  public get db() {
    const queryInterfaceSpy = this._queryInterfaceSpy
    return queryInterfaceSpy.getDb()
  }
  public async initMigration() {
    const migrationPath = this.migrationPath
    // sinon.stub()
    const queryInterfaceSpy = new QueryInterfaceSpy(sequelizeSpy)
    this._queryInterfaceSpy = queryInterfaceSpy
    for (const p of migrationPath) {
      try {
        await require(p).up(queryInterfaceSpy, Sequelize)
      } catch (err) {
        if (err.code === 1) {
          console.warn(err.message + ` ${p}`)
        }
      }
    }
  }

}

