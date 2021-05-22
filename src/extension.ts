'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// import * as sqlops from 'sqlops';

// The module 'azdata' contains the Azure Data Studio extensibility API
// This is a complementary set of APIs that add SQL / Data-specific functionality to the app
// Import the module and reference it with the alias azdata in your code below

import * as azdata from 'azdata';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    context.subscriptions.push(vscode.commands.registerCommand('extension.AddColumn', async (context: azdata.ObjectExplorerContext) => {
        console.log('action triggered');
        try {
            if (!context) {
                console.log(context);
                console.log('action cannot run');

                vscode.window.showInformationMessage("This cannot run from command menu.");
                return;
            }
            let connection = await azdata.connection.getCurrentConnection();
            let connectionId = (connection) ? connection.connectionId : undefined;

            if (!connection || !connectionId || !context.connectionProfile || !context.nodeInfo || !context.nodeInfo.metadata) {
                console.log(connection, connectionId, context);
                console.log('action conn requiured');

                vscode.window.showInformationMessage("You need to be connected to run this.");
                return;
            }
            let connectionUri = await azdata.connection.getUriForConnection(connectionId);
            console.log('action conn url');

            console.log(connectionUri);
            let queryProvider = azdata.dataprotocol.getProvider<azdata.QueryProvider>(connection.providerId, azdata.DataProviderType.QueryProvider);
            console.log(queryProvider);
            let tableName: string = `[${context.connectionProfile.databaseName}].[${context.nodeInfo.metadata.schema}].[${context.nodeInfo.metadata.name}]`;
            console.log(tableName);
            let query = `USE [${context.connectionProfile.databaseName}]; SELECT [COLUMN_NAME] FROM INFORMATION_SCHEMA.COLUMNS WHERE [TABLE_NAME]='${context.nodeInfo.metadata.name}' AND [TABLE_SCHEMA]='${context.nodeInfo.metadata.schema}'`;
            console.log(query);
            let resultSchema = await queryProvider.runQueryAndReturn(connectionUri, query);
            console.log(resultSchema);

            const colName = await vscode.window.showInputBox({
                placeHolder: "Column Name"
              });
            
              
            const colType = await vscode.window.showQuickPick(
                [
                    'INT', 'VARCHAR(50)' , 'DECIMAL(18,3)' , 'TINYINT' , 'BIGINT' 
                ]
            );
            
            if (resultSchema.rows.length > 0) {
                let finalQuery = `ALTER TABLE `;
               

                finalQuery += `\t ${tableName}`;
                finalQuery += `\t ADD ${colName}  ${colType} NULL;`;

                await vscode.commands.executeCommand('explorer.query', context.connectionProfile);

                let editor = vscode.window.activeTextEditor;
                if (editor) {
                    let doc = editor.document;
                    editor.edit(editContext => {
                        editContext.insert(new vscode.Position(0, 0), finalQuery);
                    });
                    if (false) {
                        vscode.commands.executeCommand('runQueryKeyboardAction');
                    }
                }
            }
        }
        catch (err) {
            vscode.window.showInformationMessage(err);
        }
    }));



}

// this method is called when your extension is deactivated
export function deactivate() {
}