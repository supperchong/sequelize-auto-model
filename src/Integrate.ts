import { ArrayDataTypeOptions, AbstractDataType, ModelAttributes } from "sequelize"
const { DataTypes } = require('sequelize')
const _ = require('lodash');
import * as recast from "recast";
import * as prettier from 'prettier'
import { plainObject } from "./util";
// import { dbCommentObj } from './Migration'
import { dbCommentObj, modelCommentObj } from './Comment'
interface db {
  [tableName: string]: ModelAttributes
}
DataTypes.ABSTRACT.prototype._toRawString = function () {
  if (this._length) {
    return `${this.key}(${this._length})`
  } else {
    return this.key
  }
}
class Integrate {
  static normalizeDataType(Type: any) {
    let type: any = typeof Type === 'function' ? new Type() : Type;
    return type;
  }

  static normalizeAttribute(attribute: any) {
    if (!_.isPlainObject(attribute)) {
      attribute = { type: attribute };
    }

    if (!attribute.type) return attribute;

    attribute.type = this.normalizeDataType(attribute.type);

    if (Object.prototype.hasOwnProperty.call(attribute, 'defaultValue')) {
      if (typeof attribute.defaultValue === 'function' && (
        attribute.defaultValue === DataTypes.NOW ||
        attribute.defaultValue === DataTypes.UUIDV1 ||
        attribute.defaultValue === DataTypes.UUIDV4
      )) {
        attribute.defaultValue = new attribute.defaultValue();
      }
    }

    if (attribute.type instanceof DataTypes.ENUM) {
      // The ENUM is a special case where the type is an object containing the values
      if (attribute.values) {
        attribute.type.values = attribute.type.options.values = attribute.values;
      } else {
        attribute.values = attribute.type.values;
      }

      if (!attribute.values.length) {
        throw new Error('Values for ENUM have not been defined.');
      }
    }

    return attribute;
  }
  static isEqual(attr1: ArrayDataTypeOptions<AbstractDataType>, attr2: ArrayDataTypeOptions<AbstractDataType>): boolean {
    return attr1.type.toSql() === attr2.type.toSql()
  }
  static generateModelData(modelName: string, model: ModelAttributes, dbComment?: dbCommentObj) {
    const upperModelName = _.upperFirst(modelName)
    const fields = Object.keys(model)
    let out = ''
    const commentObj: modelCommentObj = dbComment[modelName]
    const sequelizeFieldSet = new Set()
    for (const field of fields) {
      const attr = model[field]
      let commentStr = ''
      if (commentObj) {
        const fieldComment = commentObj[field]
        if (fieldComment) {
          commentStr = '//' + fieldComment
        }
      }
      const keys = Object.keys(attr)
      if (keys.length > 1) {
        out += `${field}:{`
        for (const key of keys) {
          if (key === 'type') {
            out += `${key}:${(attr as any)[key]._toRawString()},`
            sequelizeFieldSet.add((attr as any)[key].key)
          } else {
            out += `${key}:${JSON.stringify((attr as any)[key])},`
          }
        }

        out += `},${commentStr}\r\n`
      } else {
        const key: any = keys[0]
        sequelizeFieldSet.add((attr as any)[key].key)
        out += `${field}:${(attr as any)[key]._toRawString()},${commentStr}\r\n`
      }

    }
    const sequelizeFields = [...sequelizeFieldSet].reduce((prev, cur) => prev + ',' + cur)
    let data =
      `'use strict'
module.exports = app => {
  const {${sequelizeFields}} = app.Sequelize

  const model = {
    ${out}
  }

  const ${upperModelName} = app.model.define('${modelName}', model, {
    paranoid: true,
    freezeTableName: true,
    underscored: false,
  })
  ${upperModelName}.associate = function() {
  }
  ${upperModelName}.model = model
  return ${upperModelName}
}
`
    // const ast = recast.parse(data);
    // let output = recast.prettyPrint(ast, { tabWidth: 2, quote: 'single' }).code;
    let output = prettier.format(data, {
      proseWrap: "preserve",
      parser: 'babel',
      trailingComma: 'all',
      singleQuote: true,
    })
    // output = prettier.format(output, {
    //   requirePragma: true,
    //   parser: 'babel'
    // })
    return output
  }
  static toPlain() {

  }

}

export default Integrate