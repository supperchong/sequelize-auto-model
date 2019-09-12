
import Migration from "./Migration"
import * as _ from 'lodash'
import * as path from 'path'
import * as fs from 'fs'
import * as recast from 'recast'
// import { NodePath, Visitor, ASTNode } from 'ast-types'
import { NodePath, ASTNode, Visitor, Type } from 'ast-types'
import { getDbCommentFromAst } from './ast'

// type NodePath = NodePath
type Property = recast.types.namedTypes.Property
type DeclareVariable = recast.types.namedTypes.DeclareVariable
type VariableDeclaration = recast.types.namedTypes.VariableDeclaration
type MemberExpression = recast.types.namedTypes.MemberExpression
// type NodePath=recast.types.namedTypes
// type NodePath = recast.types.namedTypes
const { writeFile } = fs.promises
import { fstat } from "fs"
import { plainObject, getComments } from "./util"
import { Interface } from "readline"
~(async () => {
  const migration = new Migration({
    dir: "D:\\workspace\\zhongcai\\jingrong\\database\\migrations",
    modelKey: "program.body[1].expression.right.properties[0].value.body.body[1].expression.argument.arguments[1]",
    modelNameKey: "program.body[1].expression.right.properties[0].value.body.body[1].expression.argument.arguments[0].value"
  })
  const modelDir = 'D:\\workspace\\zhongcai\\jingrong\\app\\model'
  await migration.initMigration()
  console.log('begin init comment')
  await migration.initComment()
  console.log()
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
})()
