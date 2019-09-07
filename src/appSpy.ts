// let Sequelize = require('./Sequelize')
import { Sequelize, ModelAttributes, Model } from 'sequelize'
import sequelize, { } from './sequelizeSpy'
class AppSpy {
  model: Sequelize
  Sequelize: typeof Sequelize
  constructor() {
    this.model = sequelize
    this.Sequelize = Sequelize
  }
}
export default AppSpy