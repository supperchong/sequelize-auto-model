// import { DataTypes, Sequelize } from 'sequelize'
// import { Sequelize, DataTypes } from 'sequelize'
const { Sequelize, DataTypes } = require('sequelize')
import SequelizeSpy from './sequelizeSpy'
import { readdirSync, fstat } from 'fs'
import * as path from 'path'
import QueryInterfaceSpy from './QueryInterfaceSpy.js'
import * as sinon from 'sinon'
import Integrate from './Integrate'
import { plainObject, getComments, parse, tranformToObj } from './util'
import { dbCommentObj } from './Comment'
import * as recast from "recast";
import * as fs from 'fs'
import { getDbCommentFromAst } from './ast'
import * as _ from 'lodash'
const readFileAsync = fs.promises.readFile
// import { Sequelize } from 'sequelize/types'
// const DataTypes = Sequelize.DataTypes
const migrationRegExp = /^\d{14}.*?\.js$/
const isMigrationPath: (path: string) => boolean = path => migrationRegExp.test(path)
const resolvePath: (dir: string) => (p: string) => string = dir => p => path.resolve(dir, p)
const ignorePathFilter: (ignorePath: string[]) => (p: string) => boolean = ignorePath => p => !ignorePath.find(v => v === p)
export interface Config {
  dir: string;
  ignores?: string[];
  modelKey?: string;//use to find table object in migrations
  modelNameKey?: string;// use to find table name
  // modelDir: string;
}
interface commentOption {
  //if retain js comment
  comment: boolean
}
// export interface dbCommentObj {
//   modelName: string
//   comment: FieldComment[]
// }
interface FieldComment {
  field: string
  comment: string
}
class Migration {
  public config: Config;
  private _migrationPaths: string[]
  private _queryInterfaceSpy: QueryInterfaceSpy
  private dbComment: dbCommentObj
  constructor(config: Config) {
    this.config = config;
    this._init()
  }
  private _init() {
    this._normalizePath()
  }
  private _normalizePath() {
    const { dir: migrationDir, ignores: ignoreMigration = [] } = this.config
    const paths = readdirSync(migrationDir)
      .filter(isMigrationPath)
      .filter(ignorePathFilter(ignoreMigration))
      .map(resolvePath(migrationDir))
    this._migrationPaths = paths
  }
  public get migrationPaths() {
    return this._migrationPaths
  }
  public get db() {
    const queryInterfaceSpy = this._queryInterfaceSpy
    return queryInterfaceSpy.getDb()
  }
  public get modelNames() {
    return Object.keys(this.db)
  }
  public getComment() {
    return this.dbComment
  }
  public getMigrationType(ast: recast.types.ASTNode) {
    recast.visit(ast, {
      visitIdentifier: path => {
        console.log('path')
        return false
      }
    })
  }
  public async initComment(): Promise<void> {
    const modelKey = this.config.modelKey
    const modelNameKey = this.config.modelNameKey
    const migrationPaths = this.migrationPaths
    if (!modelKey) {
      throw new Error('please provide key to find table in migration')
    }

    // const comments: dbCommentObj[] = []
    const dbCommentObjs: dbCommentObj[] = await Promise.all(migrationPaths.map(async migrationPath => {
      try {
        const data = await readFileAsync(migrationPath, { encoding: 'utf8' })
        const ast = recast.parse(data)
        return tranformToObj(getDbCommentFromAst(ast))
      } catch (err) {
        console.log('read file ' + migrationPath + ' error', err)
      }
      return {}
    }))

    this.dbComment = _.merge({}, ...dbCommentObjs)
  }

  public generateModelFileData(modelName: string, options?: commentOption) {
    let comment: dbCommentObj = null
    if (options && options.comment) {
      comment = this.getComment()
    }
    const model = this.db[modelName]
    const modelData = Integrate.generateModelData(modelName, model, comment)
    return modelData
  }
  public generateModelFileDatas(options?: commentOption) {
    const modelNames = this.modelNames
    const modelFileDatas: plainObject = {}
    modelNames.forEach(modelName => modelFileDatas[modelName] = this.generateModelFileData(modelName, options))
    return modelFileDatas
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
  public async initMigration() {
    const migrationPath = this.migrationPaths
    // sinon.stub()
    const sequelizeSpy = new SequelizeSpy()
    const queryInterfaceSpy = new QueryInterfaceSpy((sequelizeSpy as any))
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
    this.normalizeAttribute()
  }

}
export default Migration
// (async () => {
//   const migrate = new Migration({
//     dir: 'D:\\workspace\\zhongcai\\jingrong\\database\\migrations',
//     modelKey:''
//   })

//   await migrate.initMigration()
//   await migrate.getComment()

//   // console.log(migrate.modelNames)
//   // migrate.generateModelFileData('user')
//   // await model.initModel()
//   // model.normalizeAttribute()
//   // console.log(Integrate.generateModelData('wxPassport', model.db['wxPassport']))
// })()
