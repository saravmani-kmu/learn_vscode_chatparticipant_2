cxportalwin.addCxServer
cxportalwin.editCxServer
cxportalwin.updateFolderExclusion
cxportalwin.updateFileExtension
cxportalwin.login
cxportalwin.logout
cxportalwin.scanFile
cxportalwin.scanFolder
Explorer.scanFile
Explorer.scanFolder
Explorer.scanWorkspace


From the scan window:
cxscanswin.saveReport
cxscanswin.clickQueryNode
cxscanswin.clickNodeIfNoVulnarability
cxscanswin.showQueryDescription




	context.subscriptions.push(vscode.commands.registerCommand("Explorer.scanWorkspace", async () => {
		const cxServerNode = cxTreeDataProvider.getCurrentServerNode();
		if (cxServerNode && cxServerNode.workspaceFolder) {
			await cxServerNode.scan(true, cxServerNode.workspaceFolder.fsPath);
			cxTreeDataProvider.refresh(cxServerNode);
			cxServerNode.displayCurrentScanedSource();
		}
	}));
	context.subscriptions.push(vscode.commands.registerCommand("cxportalwin.bindProject", async (serverNode: ServerNode) => {
		await serverNode.bindProject();
		cxTreeDataProvider.refresh(serverNode);
	}));
	context.subscriptions.push(vscode.commands.registerCommand("cxportalwin.unbindProject", async (serverNode: ServerNode) => {
		await serverNode.unbindProject();
		await cxTreeDataProvider.destroyTreeScans(context);
		cxTreeDataProvider.refresh(serverNode);
	}));
	context.subscriptions.push(vscode.commands.registerCommand("cxportalwin.clickToRetrieveScanResults", async (scanNode: ScanNode) => {
		if (scanNode.parentNode.isLoggedIn()) {
			// remove any entries that contain (potentially stale) results
			if (context.subscriptions.length > numOfContextSubsForCxPortalWin) {
				for (let idx = numOfContextSubsForCxPortalWin; idx < context.subscriptions.length; idx++) {
					context.subscriptions[idx].dispose();
				}
				context.subscriptions.splice(numOfContextSubsForCxPortalWin);
			}
			await scanNode.retrieveScanResults();
			await cxTreeDataProvider.createTreeScans(context, scanNode);
		} else {
			vscode.window.showErrorMessage('Access token expired. Please login.');
		}
	}));

	// record the number of registered commands
	numOfContextSubsForCxPortalWin = context.subscriptions.length;
	if (!CxSettings.isQuiet()) {
		vscode.window.showInformationMessage('Checkmarx Extension Enabled!');
	}
}

export function deactivate() { }