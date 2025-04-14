import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('snake.play', () => {
    const panel = vscode.window.createWebviewPanel(
      'snakeGame',
      '🐍 Snake Game',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, 'media')),
        ],
      }
    );

    const htmlPath = path.join(context.extensionPath, 'media', 'index.html');
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    const scriptUri = panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, 'media', 'snake.js'))
    );

    htmlContent = htmlContent.replace('{{SCRIPT}}', scriptUri.toString());
    panel.webview.html = htmlContent;
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
