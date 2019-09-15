import Migration from './Migration'
import * as _ from 'lodash'
import * as path from 'path'
import * as fs from 'fs'
import * as recast from 'recast'
// import { NodePath, Visitor, ASTNode } from 'ast-types'
import { NodePath, ASTNode, Visitor, Type } from 'ast-types'
import { plainObject, getComments } from './util'
import { modelComment, dbComment } from './Comment'
// type NodePath = NodePath
type Property = recast.types.namedTypes.Property
type DeclareVariable = recast.types.namedTypes.DeclareVariable
type VariableDeclaration = recast.types.namedTypes.VariableDeclaration
type MemberExpression = recast.types.namedTypes.MemberExpression
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
function getPathByIdentifierName(ast: any, name: string, type: string) {
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
function getVariableDeclaratorPathByIdentifierName(ast: ASTNode, name: string): any {
  let result
  recast.visit(ast, {
    visitVariableDeclarator: (path: any) => {
      if (getIdentifierName(path.value.id) === name) {
        result = path
      }
      return false
    }
  })
  return result
}
function getMemberExpressionByName(ast: ASTNode, name: string): any {
  let result
  recast.visit(ast, {
    visitMemberExpression: (path: any) => {
      if (path.value.object.name === name) {
        result = path
      }
      return false
    }
  })
  return result
}
function getPropertyOfMemberExpressionByName(ast: ASTNode, name: string): any {
  let result
  recast.visit(ast, {
    visitMemberExpression: (path: any) => {
      if (path.value.property.name === name) {
        result = path
      }
      return false
    }
  })
  return result
}
enum ChangeDataBaseMethod {
  addColumn = 'addColumn',
  changeColumn = 'changeColumn',
  createTable = 'createTable'
}
interface MapMethodName {
  [key: string]: string
}
const mapMethodName: MapMethodName = {
  addColumn: 'addColumns',
  changeColumn: 'changeColumns'
}
function getModelFromAst(ast: ASTNode): dbAttributesAst {
  let model: dbAttributesAst = null
  recast.visit(ast, {
    visitIdentifier: path => {
      if (isEqualName(path, 'exports')) {
        if (isEqualType(path.parentPath, 'MemberExpression')) {
          if (isEqualType(path.parentPath.parentPath, 'AssignmentExpression')) {
            const objectExpression = path.parentPath.parentPath.value.right
            const up = findPropertyByName(objectExpression.properties, 'up')
            if (up) {
              const identifierName = getIdentifierName(up.value.params[0])
              const queryInterfaceIdentifier = getMemberExpressionByName(
                up.value.body,
                identifierName
              )
              if (queryInterfaceIdentifier) {
                const methodName: ChangeDataBaseMethod =
                  queryInterfaceIdentifier.value.property.name
                if (methodName === 'createTable') {
                  model = {
                    methodName,
                    tableName: queryInterfaceIdentifier.parentPath.value.arguments[0].value,
                    attributesAst: queryInterfaceIdentifier.parentPath.value.arguments[1]
                  }
                } else if (['addColumn', 'changeColumn'].find(v => v === methodName)) {
                  const path: any = getVariableDeclaratorPathByIdentifierName(
                    ast,
                    mapMethodName[methodName]
                  )
                  if (path) {
                    model = {
                      methodName,
                      attributesAst: path.value.init
                    }
                  }
                } else {
                  throw new Error('only support  createTable addColumn changeColumn')
                }
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
interface dbAttributesAst {
  methodName: string
  tableName?: string
  attributesAst: any
}

function getDbCommentFromAst(ast: ASTNode): dbComment {
  const model: dbAttributesAst = getModelFromAst(ast)
  let dbComment: dbComment = {}
  if (!model) return dbComment
  switch (model.methodName) {
    case 'createTable': {
      let tableComment = {}
      dbComment[model.tableName] = getComments(model.attributesAst)
      break
    }
    case 'addColumn':
    case 'changeColumn': {
      for (const property of model.attributesAst.properties) {
        const modelName = getIdentifierName(property.key)
        dbComment[modelName] = getComments(property.value)
      }
    }
    default: {
    }
  }
  return dbComment
}

export {
  getDbCommentFromAst,
  getMemberExpressionByName,
  getPropertyOfMemberExpressionByName,
  getVariableDeclaratorPathByIdentifierName
}
