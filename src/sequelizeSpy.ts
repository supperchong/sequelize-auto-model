import {
  Sequelize,
  Model,
  ModelOptions,
  DataTypes,
  AbstractDataType,
  ModelAttributes,
  ModelCtor
} from 'sequelize'
import MyError from './MyError'
import { ASTNode } from 'ast-types'
const _ = require('lodash')
export interface modelObject {
  modelName: string
  attributes: ModelAttributes
  ast?: ASTNode
}
interface plainObject {
  [key: string]: string | plainObject
}
interface InitOptions {
  modelName: string
  sequelize: SequelizeSpy
}
export class SequelizeSpy {
  models: modelObject[] = []
  public define(modelName: string, attributes: ModelAttributes, options?: InitOptions) {
    const models = this.models
    const model = class {
      public static init(attributes: ModelAttributes, options: InitOptions) {
        models.push({
          modelName,
          attributes
        })
      }
    }
    options.modelName = modelName
    options.sequelize = this
    model.init(attributes, options)

    return model
  }
}

const methods = [
  'beforeValidate',
  'afterValidate',
  'beforeCreate',
  'afterCreate',
  'beforeDestroy',
  'afterDestroy',
  'beforeUpdate',
  'afterUpdate',
  'beforeBulkCreate',
  'afterBulkCreate',
  'beforeBulkDestroy',
  'afterBulkDestroy',
  'beforeBulkUpdate',
  'afterBulkUpdate',
  'beforeFind',
  'beforeFindAfterExpandIncludeAll',
  'beforeFindAfterOptions',
  'afterFind',
  'beforeDefine',
  'afterDefine',
  'beforeInit',
  'afterInit',
  'beforeBulkSync',
  'afterBulkSync',
  'beforeSync',
  'afterSync',
  'getDialect',
  'getQueryInterface',
  // 'define',
  'model',
  'isDefined',
  'import',
  'query',
  'random',
  'set',
  'escape',
  'createSchema',
  'showAllSchemas',
  'dropSchema',
  'dropAllSchemas',
  'sync',
  'truncate',
  'drop',
  'authenticate',
  'validate',
  'transaction',
  'close',
  'databaseVersion'
]
for (const method of methods) {
  ;(SequelizeSpy.prototype as any)[method] = function() {
    throw new MyError({
      code: 1,
      msg: `method ${method} not support will skip file`
    })
  }
}

export default SequelizeSpy
