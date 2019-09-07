import { QueryInterface, ModelAttributes, ModelAttributeColumnOptions, DataType, Sequelize } from "sequelize"
interface DB {
  [tableName: string]: ModelAttributes
}
class QueryInterfaceSpy {
  _db: DB = {}
  sequelize: Sequelize
  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize
    // super(sequelize)
  }
  async createTable(tableName: string,
    attributes: ModelAttributes) {
    this._db[tableName] = attributes;
  }
  async addColumn(tableName: string, key: string, attribute: ModelAttributeColumnOptions | DataType) {
    await this.checkTableExist(tableName);
    await this.checkFieldEmpty(tableName, key);
    this._db[tableName][key] = attribute;
  }
  async changeColumn(tableName: string, attributeName: string, dataTypeOrOptions: DataType | ModelAttributeColumnOptions) {
    await this.checkTableExist(tableName);
    await this.checkFieldExist(tableName, attributeName);
    this._db[tableName][attributeName] = dataTypeOrOptions;
  }

  async checkTableExist(tableName: string) {
    if (!this._db[tableName]) {
      return Promise.reject(`table ${tableName} not exist`);
    }
  }
  async checkFieldEmpty(tableName: string, key: string) {
    if (this._db[tableName][key]) {
      return Promise.reject(`table ${tableName} key already exist`);
    }
  }
  async checkFieldExist(tableName: string, key: string) {
    if (!this._db[tableName][key]) {
      return Promise.reject(`table ${tableName} key not exist`);
    }
  }
  async removeColumn(tableName: string, key: string) {
    await this.checkTableExist(tableName);
    await this.checkFieldExist(tableName, key);
    delete this._db[tableName][key];
  }
  getDb() {
    return this._db;
  }
}
export default QueryInterfaceSpy
