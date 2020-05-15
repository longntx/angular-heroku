import { Component } from '@angular/core';
import { createSkipSelf } from '@angular/compiler/src/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'change-log-convert';
  projectPrefix = `FTD`;
  source: string;
  result: string;
  // regex = /^(FTD-([0-9]*)):(.*)((.|\s)*?- #([0-9]*))(.*)/gm;
  // regexMultilines = /\s\s\s+/gm;
  // regexMergin = /^(Merge in)(.*)(.|\s)*/gm;
  // regexForReserve = /^\*.*\)/gm;
  blahRegexToCheckDuplicate = /(FTD-[0-9]*)(.*)(\[PR.*\))/gm;
  bitBucketRepoLink = 'https://bitbucket.org/est-rouge/ftd-admin-console/pull-requests/';

  convert(sourceString: string): void | string {
    if (sourceString.length === 0) {
      return '';
    }
    this.result = this.regConvert(sourceString.trim());
  }

  private regConvert(sourceString: string): string {
    let m;
    let finalRes = '';
    const res = [];
    const regexVariables = this.generateDefaultVariables();

    const a = sourceString
      .replace(regexVariables.regex, `* [$1]$3 [PR#$6](` + this.bitBucketRepoLink.trim() + `$6)`)
      .replace(regexVariables.regexMultilines, '\n')
      .replace(regexVariables.regexMergin, '');
    // tslint:disable-next-line:no-conditional-assignment
    while ((m = regexVariables.regexForReserve.exec(a)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regexVariables.regexForReserve.lastIndex) {
        regexVariables.regexForReserve.lastIndex++;
      }

      // The result can be accessed through the `m`-variable.
      m.forEach((match, groupIndex) => {
        if (match) {
          if (res.length === 0) {
            res.push(match);
          } else {
            const temp = this.checkExist(match, res, regexVariables);
            if (temp && temp.exist) {
              res[temp.index] += ', ' + temp.result;
            } else {
              res.push(match);
            }
          }
        }
      });
    }
    res.reverse().map(element => (finalRes += element + '\n'));
    return finalRes;
  }

  private checkExist(
    source: string,
    arrayToCheck: Array<string>,
    regexVariables
  ): {
    exist: boolean;
    index: number;
    duplicate: string;
    result: string;
  } {
    let indexExistPR = -1;
    const regExp = regexVariables.regexToCheckDuplicate;
    regExp.lastIndex = 0;
    const subString = regExp.exec(source);
    if (subString && subString[1]) {
      indexExistPR = arrayToCheck.findIndex(value => value.includes(`[${subString[1]}]`));
    }
    if (indexExistPR > -1) {
      return {
        exist: true,
        index: indexExistPR,
        duplicate: subString[1],
        result: subString[3],
      };
    }
    return {
      exist: false,
      index: -1,
      duplicate: '',
      result: '',
    };
  }

  private generateDefaultVariables() {
    return {
      regex: new RegExp(`(${this.projectPrefix.trim()}-([0-9]*)):(.*)((.|\\s)*?- #([0-9]*))(.*)`, 'gm'),
      regexMultilines: /\s\s\s+/gm,
      regexMergin: /^(Merge in)(.*)(.|\s)*/gm,
      regexForReserve: /^\*.*\)/gm,
      regexToCheckDuplicate: new RegExp(`(${this.projectPrefix.trim()}-[0-9]*)(.*)(\\[PR.*\\))`, 'gm'),
    };
  }
}
