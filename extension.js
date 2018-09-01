// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const client = require('cheerio-httpcli');
const opn = require('opn');

var AtCoderLogin = function(){
    client.fetch('https://beta.atcoder.jp/login')
    .then(function(result){
        var loginInfo = {
            'username' : process.env.ATCODER_USERNAME,
            'password' : process.env.ATCODER_PASSWORD,
        };

        result.$('#main-container > div > div > form').submit(loginInfo,function(err,$,res,body){
            vscode.window.showInformationMessage('AtCoderSubmitter loggin!');
        })
    });
}

var AtCoderSubmitSource = function(contest_id,problem_id,language_id,source){
    client.fetch(`https://beta.atcoder.jp/contests/${contest_id}/submit`)
    .then(function(result){
        var submitData = {
            'data.TaskScreenName': problem_id,
            'data.LanguageId' : language_id,
            'sourceCode' : source
        };

        result.$('#main-container > div > div:nth-child(2) > form').submit(submitData,function(err,$,res,body){
            if(res.statusCode == 200){
                var submission_url = $('table > tbody > tr:nth-child(1) > td:nth-child(8) > a').attr('href');
                vscode.window.showInformationMessage('submit!');
                //opn(`https://beta.atcoder.jp/contests/${contest_id}/submissions/me`)

                if(submission_url == undefined) return;
                submission_url = 'https://beta.atcoder.jp' + submission_url
                var get_submission = function(){
                    client.fetch(submission_url,function(err,$,res,body){
                        var judge = $('table > tr:nth-child(7) > td').text();
                        if(judge == undefined) return;
                        if(judge.includes('/') || judge.includes('WJ')){
                            setTimeout(get_submission,1500);
                            return;
                        }
                        vscode.window.showInformationMessage('your submit is ' + judge,"Detail","Close").then(function(res){
                            if(res == undefined) return;
                            if(res = "Detail"){
                                opn(submission_url);
                            }
                        });
                        return;
                    })
                }

                get_submission();

            }
        });
    });
}

var AtCoderSubmitNormal = function(){
    vscode.window.showInputBox({
        prompt: 'contest_id',
        placeHolder: 'example: arc101'
    }).then(function (contest_id) {
        if (contest_id == undefined) return;
        vscode.window.showInputBox({
            prompt: 'problem_id',
            placeHolder: 'example: arc101_a'
        }).then(function (problem_id) {
            if (problem_id == undefined) return;
            var language_id = vscode.workspace.getConfiguration('atcodersubmitter').get('language_id');
            AtCoderSubmitSource(contest_id, problem_id, language_id, vscode.window.activeTextEditor.document.getText());
        })
    });
}
var AtCoderSubmitContestMode = function(contest_id){
    vscode.window.showInputBox({
        prompt: 'problem',
        placeHolder: 'a,b,c,d,...'
    }).then(function (problem) {
        if (problem == undefined) return;
        var language_id = vscode.workspace.getConfiguration('atcodersubmitter').get('language_id');
        AtCoderSubmitSource(contest_id,`${contest_id}_${problem}`,language_id,vscode.window.activeTextEditor.document.getText());
    });
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    AtCoderLogin();

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('AtCoderSubmitter.Login', function () {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        AtCoderLogin();
        vscode.window.showInformationMessage('you are logged in!');
    });

    let submit_diposable = vscode.commands.registerCommand('AtCoderSubmitter.Submit',function(){
        var contest_id = vscode.workspace.getConfiguration('atcodersubmitter').get('contest_id');
        if(contest_id == "") AtCoderSubmitNormal();
        else AtCoderSubmitContestMode(contest_id);
    })

    context.subscriptions.push(disposable);
    context.subscriptions.push(submit_diposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;