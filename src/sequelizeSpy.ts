import { Sequelize, Model, ModelOptions, InitOptions, ModelAttributes } from 'sequelize'
import MyError from './myError'
interface plainObject {
  [key: string]: any
}

export class SequelizeSpy extends Sequelize {
  modelManagerSpy: plainObject = {}
  public define(modelName: string, attributes: ModelAttributes, options?: InitOptions) {
    const modelManagerSpy = this.modelManagerSpy
    const model = class extends Model {
      public init(attributes: ModelAttributes, options?: InitOptions) {
        modelManagerSpy[modelName] = attributes
      }
    };
    options.modelName = modelName;
    options.sequelize = sequelize
    model.init(attributes, options as any);

    return model;
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
  (SequelizeSpy.prototype as any)[method] = function () {
    throw new MyError({
      code: 1,
      msg: `method ${method} not support will skip file`
    })
  }
}


const sequelize: SequelizeSpy = new SequelizeSpy()

export default sequelize