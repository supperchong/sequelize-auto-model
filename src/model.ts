// import { DataTypes, Sequelize } from 'sequelize'
// import { Sequelize, DataTypes } from 'sequelize'
const { Sequelize, DataTypes } = require('sequelize')
import sequelizeSpy from './sequelizeSpy'
import { readdirSync } from 'fs'
import * as path from 'path'
import QueryInterfaceSpy from './QueryInterfaceSpy.js'
import * as sinon from 'sinon'
import App from './appSpy'
// const DataTypes = Sequelize.DataTypes
const modelRegExp = /\.js$/
const isModelPath: (path: string) => boolean = path => modelRegExp.test(path)
const resolvePath: (dir: string) => (p: string) => string = dir => p => path.resolve(dir, p)
const ignorePathFilter: (ignorePath: string[]) => (p: string) => boolean = (ignorePath = []) => p => !ignorePath.find(v => v === p)
export interface Config {
  dir: string;
  ignores?: string[];
}
class Model {
  public config: Config;
  private _modelPaths: string[]
  private _queryInterfaceSpy: QueryInterfaceSpy
  private _app: App
  constructor(config: Config) {
    this.config = config;
    this._init()
  }
  private _init() {
    this._initApp()
    this._normalizePath()
  }
  private _normalizePath() {
    const { dir, ignores = [] } = this.config
    const paths = readdirSync(dir)
      .filter(isModelPath)
      .filter(ignorePathFilter(ignores))
      .map(resolvePath(dir))
    this._modelPaths = paths
  }
  private _initApp() {
    const app = new App()
    this._app = app
  }
  public get modelPaths() {
    return this._modelPaths
  }
  public get db() {
    const queryInterfaceSpy = this._queryInterfaceSpy
    return queryInterfaceSpy.getDb()
  }
  public async initModel() {
    const modelPaths = this.modelPaths
    // sinon.stub()
    const queryInterfaceSpy = new QueryInterfaceSpy(sequelizeSpy)
    this._queryInterfaceSpy = queryInterfaceSpy

    for (const p of modelPaths) {
      try {
        await require(p)(this._app)
      } catch (err) {
        if (err.code === 1) {
          console.warn(err.message + ` ${p}`)
        } else {
          console.log('err', err)
        }
      }
    }
  }

}


