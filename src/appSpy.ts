// let Sequelize = require('./Sequelize')
import { Sequelize, ModelAttributes, Model } from 'sequelize'
import SequelizeSpy, { modelObject } from './SequelizeSpy'
class AppSpy {
  model: SequelizeSpy
  Sequelize: typeof Sequelize
  constructor() {
    this.model = new SequelizeSpy()
    this.Sequelize = Sequelize
  }
  public get db() {
    const models = this.model.models
    const db: any = {}
    for (const { modelName, attributes } of models) {
      db[modelName] = attributes
    }
    return db
  }
  public get models(): modelObject[] {
    return this.model.models
  }
  public get currentModel() {
    const models = this.model.models
    return models[models.length - 1]
  }
  public get currentTableName(): string {
    return this.currentModel.modelName
  }
}
export default AppSpy