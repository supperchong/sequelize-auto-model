// import { DataTypes, Sequelize } from 'sequelize'
// import { Sequelize, DataTypes } from 'sequelize'
const { Sequelize, DataTypes } = require('sequelize')
import sequelizeSpy, { modelObject } from './sequelizeSpy'
import { readdirSync, fstat } from 'fs'
import * as path from 'path'
import QueryInterfaceSpy from './QueryInterfaceSpy.js'
import * as sinon from 'sinon'
import App from './appSpy'
import Integrate from './Integrate'
import * as recast from "recast";
import * as fs from 'fs'
import * as _ from 'lodash'
// const _ = require('lodash');

// const DataTypes = Sequelize.DataTypes
const modelRegExp = /\.js$/
const isModelPath: (path: string) => boolean = path => modelRegExp.test(path)
const resolvePath: (dir: string) => (p: string) => string = dir => p => path.resolve(dir, p)
const ignorePathFilter: (ignorePath: string[]) => (p: string) => boolean = (ignorePath = []) => p => !ignorePath.find(v => v === p)
export interface Config {
  dir: string;
  ignores?: string[];
}

// DataTypes
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

    return this._app.db
  }
  public get app() {
    return this._app
  }
  public readModelAst(code: string) {
    const ast = recast.parse(code);
    return ast
  }
  public changeAst(modelName: string, newAttributes: any) {
    const model = this.models().find(model => model.modelName === modelName)
    if (!model) {
      throw new Error('model is not exist')
    }
    const attributes = model.attributes
    const curFields = Object.keys(attributes)
    const newFields = Object.keys(newAttributes)
    // const fields = _.union(curFields, newFields)
    for (const field of newFields) {
      if (!_.isEqual(attributes[field], newAttributes[field])) {
        console.log(`table ${modelName}:, migration has ${JSON.stringify(newAttributes[field])} , and model has ${JSON.stringify(attributes[field])}`)
      }
    }
  }
  public models(): modelObject[] {
    return this.app.models
  }
  public normalizeAttribute() {
    const tableNames = Object.keys(this.db)
    for (const tableName of tableNames) {
      const table = this.db[tableName]
      const fields = Object.keys(table)
      for (const field of fields) {
        table[field] = Integrate.normalizeAttribute(table[field])
      }
    }
  }
  public async initModel() {
    const modelPaths = this.modelPaths
    // sinon.stub()
    // const queryInterfaceSpy = new QueryInterfaceSpy(sequelizeSpy)
    // this._queryInterfaceSpy = queryInterfaceSpy
    let breforeModelName = ''
    for (const p of modelPaths) {
      try {
        const code = fs.readFileSync(p, {
          encoding: 'utf8'
        })
        const ast = this.readModelAst(code)
        await require(p)(this.app)
        let currentModelName = this.app.currentTableName
        if (breforeModelName === currentModelName) {
          throw new Error('model name duplication')
        }
        const model = this.app.currentModel
        model['ast'] = ast
        breforeModelName = currentModelName
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
(async () => {
  const model = new Model({
    dir: 'D:\\workspace\\xiaochuang_3.0\\backend\\app\\model'
  })

  await model.initModel()
  model.normalizeAttribute()
  console.log(Integrate.generateModelData('wxPassport', model.db['wxPassport']))
  // console.log(model.models('wxPassport',))
  // const tableNames = Object.keys(model.db)
  // for (const tableName of tableNames) {
  //   const table = model.db[tableName]
  //   const fields = Object.keys(table)
  //   for (const field of fields) {
  //     table[field] = Integrate.normalizeAttribute(table[field])
  //   }
  // }
  // for (const key in model.db.wxPassport.createdAt.type) {
  //   console.log('key', key)
  // }
  // console.log(DataTypes)
  // console.log('_toRawString', model.db.classification)
})()




