import * as vscode from 'vscode';
import { createCanvas } from "canvas";

//本編
export function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('lineNumberOrder');

  vscode.workspace.onDidChangeTextDocument(event => {
    //行番号チェック
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = event.document.getText().split('\n');

    let previousNumber = -1;
    lines.forEach((line, index) => {
      const match = line.match(/^\d+/);
      if (match) {
        const currentNumber = parseInt(match[0], 10);
        const range = new vscode.Range(index, 0, index, line.length);
        if (currentNumber <= previousNumber) {

          const diagnostic = new vscode.Diagnostic(
            range,
            'Line number is out of order.',
            vscode.DiagnosticSeverity.Error
          );
          diagnostics.push(diagnostic);
        } else {
          previousNumber = currentNumber;
          if (currentNumber > 65535) {
            const diagnostic = new vscode.Diagnostic(
              range,
              'Line number is out of range.',
              vscode.DiagnosticSeverity.Error
            );
            diagnostics.push(diagnostic);
          }
        }
      }

    });



    diagnosticCollection.set(event.document.uri, diagnostics);
  });



  //const imageBase64 = binaryToImage(binary);

  // ホバー表示の登録
  const hoverProvider = vscode.languages.registerHoverProvider('*', {
    provideHover(document, position) {
      const hoveredRange = document.getWordRangeAtPosition(position, /\"[0-9a-fA-F]{2,}\"/);
      if (hoveredRange) {
        const hexdata = document.lineAt(position.line).text.slice(hoveredRange.start.character, hoveredRange.end.character);
        const hex_data_without_quote = hexdata.replace(/\"/g, "");
        const markdownString = new vscode.MarkdownString(
          `![Generated Image](${binaryToImage(hex_data_without_quote)})`
        );

        markdownString.isTrusted = true; // 外部リソースを許可
        return new vscode.Hover(markdownString, hoveredRange);
      }
    }
  });

  context.subscriptions.push(hoverProvider);
  context.subscriptions.push(diagnosticCollection);
}

export function deactivate() { }

function binaryToImage(hexstr: string): string {
  // 1. インメモリ画像を生成
  console.log(hexstr);
  const binary_list = HexString2Binary(hexstr)
  console.log(binary_list);
  const factor = 30;
  var svgdata = `<svg width="${binary_list.length * factor}" height="${8 * factor}" viewBox="0, 0, ${binary_list.length * factor}, ${8 * factor}" xmlns="http://www.w3.org/2000/svg">`
  for (let colomn = 0; colomn < binary_list.length; colomn++) {
    const element = binary_list[colomn];
    for (let row = 0; row <element.length; row++) {
      const pixeldata = parseInt(element[row]);
      const filldata = `<rect x="${colomn * factor}" y="${(7-row) * factor}" width="${factor}" height="${factor}" fill="${pixeldata == 1 ? "#000000" : "#FFFFFF"}" />`;
      svgdata += filldata;
    }
  }
  svgdata += "</svg>";

  const base64Image = "data:image/svg+xml;charset=utf8," + encodeURIComponent(svgdata);

  return base64Image
}

function HexString2Binary(hexString: string): string[] {
  if (hexString.length % 2 !== 0) {
    throw new Error("The input string must have an even number of characters.");
  }

  let binaryArray: string[] = [];
  // 偶数文字目と奇数文字目を入れ替える
  for (let i = 0; i < hexString.length; i += 2) {
    const two_digits = hexString[i] + hexString[i + 1];

    // 16進数を2進数に変換
    let binaryString = parseInt(two_digits, 16).toString(2);

    console.log(binaryString);

    // 8の倍数の桁数になるように先頭を0でパディングして追加
    const paddingLength = 8 - (binaryString.length % 8);
    if (paddingLength < 8) {
      binaryArray.push('0'.repeat(paddingLength) + binaryString);
    }
  }


  return binaryArray;
}