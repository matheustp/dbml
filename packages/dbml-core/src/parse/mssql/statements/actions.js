const _ = require('lodash');

function findTable (ast, tableName) {
  return ast.tables.find(_table => _table.name === tableName);
}

function findField (table, fieldName) {
  return table.fields.find(_field => _field.name === fieldName);
}

function handleIndexes (index, ast) {
  const table = findTable(ast, index.tableName);
  table.indexes.push(index);
  index.tableName = null;
}

function pushOut (values, astProp) {
  values.forEach(value => {
    astProp.push(value);
  });
}
function handleTable (table, ast) {
  pushOut(table.enums, ast.enums);
  pushOut(table.refs, ast.refs);
  table.enums.forEach(_enum => {
    _enum.fieldName = null;
  });
  table.enums = null;
  table.refs = null;
}

function handleDefaults (dbdefault, ast) {
  const table = findTable(ast, dbdefault.tableName);
  const field = findField(table, dbdefault.fieldName);
  dbdefault.fieldName = null;
  dbdefault.tableName = null;
  field.dbdefault = dbdefault;
}

function handleEnums (_enum, ast) {
  const table = findTable(ast, _enum.tableName);
  const field = findField(table, _enum.fieldName);
  _enum.name = `${_enum.tableName}_${_enum.fieldName}_enum`;
  _enum.fieldName = null;
  _enum.tableName = null;
  field.type.type_name = _enum.name;
  field.type.args = _enum.values.map(value => `'${value.name}'`).join(', ');
}

function handleStatement (_statements) {
  const ast = {
    tables: [],
    refs: [],
    indexes: [],
    enums: [],
  };
  const statements = _.flatten(_statements);
  statements.forEach(statement => {
    if (!statement) return;
    switch (statement.type) {
      case 'tables':
        handleTable(statement.value, ast);
        break;
      // from alter table add
      case 'indexes':
        handleIndexes(statement.value, ast);
        break;
      case 'dbdefault':
        handleDefaults(statement.value, ast);
        break;
      case 'enums':
        handleEnums(statement.value, ast);
        break;
      default:
        break;
    }
    if (statement.type && ast[statement.type]) ast[statement.type].push(statement.value);
  });
  ast.indexes = null;
  return ast;
}

module.exports = { handleStatement };
