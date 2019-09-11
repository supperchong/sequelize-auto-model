
import Migration from "./Migration"
import * as _ from 'lodash'
import * as path from 'path'
import * as fs from 'fs'
import * as recast from 'recast'
type Property = recast.types.namedTypes.Property
const { writeFile } = fs.promises
import { fstat } from "fs"
import { plainObject } from "./util"
~(async () => {
  const migration = new Migration({
    dir: "D:\\workspace\\zhongcai\\jingrong\\database\\migrations",
    modelKey: "program.body[1].expression.right.properties[0].value.body.body[1].expression.argument.arguments[1]",
    modelNameKey: "program.body[1].expression.right.properties[0].value.body.body[1].expression.argument.arguments[0].value"
  })
  const modelDir = 'D:\\workspace\\zhongcai\\jingrong\\app\\model'
  await migration.initMigration()
  await migration.initComment()
  const modelFileDatas = migration.generateModelFileDatas({
    comment: true
  })
  const migrationPaths = migration.migrationPaths
  const modelNames = Object.keys(modelFileDatas)
  await Promise.all(modelNames.map(async modelName => {
    const upperName = _.upperFirst(modelName)
    const modelPath = path.resolve(modelDir, upperName + '.js')
    const modelData = modelFileDatas[modelName]
    await writeFile(modelPath, modelData)
  }))
})
const ast = recast.parse(`
'use strict'

module.exports = {
  up: async (db, Sequelize) => {
    const { TEXT, INTEGER, DATE, DATEONLY, STRING, BIGINT, FLOAT, DECIMAL } = Sequelize
    const addColumns = {
      companyNeed:	{
        type: STRING(50), // 需求类别种类
      },
      message:	{
        status: { type: INTEGER(2), defaultValue: 1 }, // 状态 1成功 2失败
      },

    }
    await Promise.all(Object.keys(addColumns).map(async table =>
      await Promise.all(Object.keys(addColumns[table]).map(key => db.addColumn(table, key, addColumns[table][key]
      )))
      // queryInterface.addColumn('company',key,columns[key])
    ))
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  },
}


`)
function getPathType(path: any) {
  return path.value.type
}
function getPathName(path: any) {
  return path.value.name
}
function getPropertyName(property: any) {
  return property.key.name
}
function getIdentifierName(identifier: any) {
  return identifier.name
}
function findPropertyByName(properties: any, name: string) {
  return properties.find((property: any) => getPropertyName(property) === name)
}
function isEqualName(path: any, name: string) {
  return getPathName(path) === name
}
function isEqualType(path: any, typeName: string) {
  return path.value.type === typeName
}
function getPathByIdentifierName(ast: any, name: string) {
  let result
  recast.visit(ast, {
    visitIdentifier: path => {
      if (isEqualName(path, name)) {
        result = path
      }
      return false
    }
  })
  return result
}
function getMemberExpressionByName(ast: any, name: string): any {
  let result
  recast.visit(ast, {
    visitMemberExpression: (path: any) => {
      console.log(path)
      if (path.value.object.name === name) {
        result = path
      }
      return false
    }
  })
  return result
}
const mapMethodName = {
  addColumn: 'addColumns',
  changeColumns: 'changeColumns'
}
function getModelFromAst(ast: any) {
  let model: plainObject = null
  recast.visit(ast, {
    visitIdentifier: path => {
      if (isEqualName(path, 'exports')) {
        if (isEqualType(path.parentPath, 'MemberExpression')) {
          if (isEqualType(path.parentPath.parentPath, 'AssignmentExpression')) {
            const objectExpression = path.parentPath.parentPath.value.right
            const up = findPropertyByName(objectExpression.properties, 'up')
            if (up) {
              //getPathName(up) ===ArrowFunctionExpression
              const identifierName = getIdentifierName(up.value.params[0])
              // console.log('identifierName', identifierName)
              const queryInterfaceIdentifier = getMemberExpressionByName(up.value.body, identifierName)
              if (queryInterfaceIdentifier) {


                const methodName: string = queryInterfaceIdentifier.value.property.name
                if (methodName === 'createTable') {
                  model = {
                    methodName,
                    modelName: queryInterfaceIdentifier.parentPath.value.arguments[0].value,
                    literalAttr: queryInterfaceIdentifier.parentPath.value.arguments[1]
                  }
                } else if (['addColumn', 'changeColumn'].find(v => v === methodName)) {
                  // const name = mapMethodName[methodName]
                } else {
                  throw new Error('only support  createTable addColumn changeColumn')
                }

                // modelName = queryInterfaceIdentifier.parentPath.value.arguments[0].value
                // model.literalAttr = queryInterfaceIdentifier.parentPath.value.arguments[1]
              }

            }
          }
        }
      }
      return false
    }
  })
  return model
}
console.log(getModelFromAst(ast))