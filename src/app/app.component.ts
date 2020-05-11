import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'change-log-convert';
  source: string;
  result: string;
  regex = /^(FTD-([0-9]*)):(.*)((.|\s)*?- #([0-9]*))(.*)/gm;
  regexMultilines = /\s\s\s+/gm;
  regexMergin = /^(Merge in)(.*)(.|\s)*/gm;
  regexForReserve = /^\*.*\)/gm;
  regexToCheckDuplicate = /(FTD-[0-9]*)(.*)(\[PR.*\))/gm;
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

    const a = sourceString
      .replace(this.regex, `* [$1] $3 [PR#$6](` + this.bitBucketRepoLink.trim() + `$6)`)
      .replace(this.regexMultilines, '\n')
      .replace(this.regexMergin, '');
    // tslint:disable-next-line:no-conditional-assignment
    while ((m = this.regexForReserve.exec(a)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === this.regexForReserve.lastIndex) {
        this.regexForReserve.lastIndex++;
      }

      // The result can be accessed through the `m`-variable.
      m.forEach((match, groupIndex) => {
        if (match) {
          if (res.length === 0) {
            res.push(match);
          } else {
            const temp = this.checkExist(match, res);
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
    arrayToCheck: Array<string>
  ): {
    exist: boolean;
    index: number;
    duplicate: string;
    result: string;
  } {
    let indexExistPR = -1;
    const subString = this.regexToCheckDuplicate.exec(source);
    if (subString && subString[1]) {
      indexExistPR = arrayToCheck.findIndex(value => value.includes(subString[1]));
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
}
