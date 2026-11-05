import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { expect, it } from 'vitest';

function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? sources(path)
      : path.endsWith('.tsx')
        ? [path]
        : [];
  });
}

it('keeps literal UI copy out of components and route components', () => {
  const violations: string[] = [];
  const textAttributes = new Set([
    'alt',
    'title',
    'placeholder',
    'aria-label',
    'aria-description',
    'aria-roledescription',
    'label',
  ]);
  const textProperties = new Set([
    'name',
    'title',
    'description',
    'caption',
    'label',
    'alt',
  ]);
  for (const path of [...sources('components'), ...sources('app')]) {
    const source = ts.createSourceFile(
      path,
      readFileSync(path, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    function record(node: ts.Node) {
      const position = source.getLineAndCharacterOfPosition(
        node.getStart(source),
      );
      violations.push(
        `${relative('.', path)}:${position.line + 1}: ${node.getText(source)}`,
      );
    }
    function visit(node: ts.Node) {
      if (ts.isJsxText(node) && node.text.trim()) record(node);
      if (
        ts.isJsxExpression(node) &&
        node.expression &&
        ts.isStringLiteralLike(node.expression) &&
        node.expression.text.trim()
      )
        record(node);
      if (
        ts.isJsxAttribute(node) &&
        textAttributes.has(node.name.getText(source)) &&
        node.initializer
      ) {
        const value = ts.isJsxExpression(node.initializer)
          ? node.initializer.expression
          : node.initializer;
        if (value && ts.isStringLiteralLike(value) && value.text.trim())
          record(node);
      }
      if (
        ts.isPropertyAssignment(node) &&
        textProperties.has(node.name.getText(source)) &&
        ts.isStringLiteralLike(node.initializer) &&
        node.initializer.text.trim()
      )
        record(node);
      if (
        ts.isBindingElement(node) &&
        textAttributes.has(node.name.getText(source)) &&
        node.initializer &&
        ts.isStringLiteralLike(node.initializer) &&
        node.initializer.text.trim()
      )
        record(node);
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  expect(violations).toEqual([]);
});
