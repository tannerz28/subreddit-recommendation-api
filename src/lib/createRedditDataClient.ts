import fuzzysort from "fuzzysort";
import { promises as fs } from "fs";

export default function createDataClient() {
  const fileNames = getFileNames();
  const downloaded = new Map<string, any>();
  const indexed = new Map();
  const list: any[] = [];
  let prepared: any[] = [];

  const endpoint = "./data/1/";

  let sizeCount = 1;
  let sizes = new Map();
  fs.readFile(endpoint + "count.json", { encoding: "utf8" }).then((data) => {
    const rows = JSON.parse(data);

    rows.forEach((row: any, index: number) => {
      row.forEach((subreddit: any) => {
        sizes.set(subreddit, index + 2);
      });
    });

    sizeCount = rows.length + 2;
  });

  return {
    getRelated,
    getSuggestion,
    getSize,
  };

  function getSize(subName: string) {
    let size = sizes.get(subName);
    return (size || 1) / sizeCount;
  }

  async function getSuggestion(
    query: string
  ): Promise<Array<{ html: string; text: string }>> {
    let firstLetter = query[0].toLocaleLowerCase();
    let results = downloaded.get(firstLetter);
    if (results) {
      results = fuzzysort.go(query, prepared, { limit: 10 });
      return results.map((x: any) => ({
        html: fuzzysort.highlight(x, "<b>", "</b>"),
        text: x.target,
      }));
    } else {
      await downloadAndIndexFile(firstLetter);
      return getSuggestion(query);
    }
  }

  async function getRelated(query: string) {
    let sims = indexed.get(query.toLocaleLowerCase());
    if (sims) return sims;

    return getFileForQuery(query);
  }

  async function downloadAndIndexFile(firstLetter: string) {
    let url = endpoint + fileNames.get(firstLetter);
    console.log("download ", firstLetter);
    return fs.readFile(url, { encoding: "utf8" }).then((data) => {
      const response = JSON.parse(data);
      downloaded.set(firstLetter, response);
      response.forEach((row: any[]) => {
        let keyName = row[0].toLocaleLowerCase();
        if (indexed.get(keyName)) return;

        list.push(row[0]);
        indexed.set(keyName, row);
      });
      prepared = list.map((l) => fuzzysort.prepare(l));
    });
  }

  async function getFileForQuery(query: string) {
    let firstLetter = query[0].toLocaleLowerCase();
    let results = downloaded.get(firstLetter);
    if (results) return [];

    await downloadAndIndexFile(firstLetter);
    let sims = indexed.get(query.toLocaleLowerCase());
    return sims || [];
  }
}

function getFileNames() {
  let fileNamesIndex = new Map<string, string>();
  [
    "0_z0123456789jqx.json",
    "10_m.json",
    "11_l.json",
    "12_i.json",
    "13_h.json",
    "14_g.json",
    "15_f.json",
    "16_e.json",
    "17_d.json",
    "18_c.json",
    "19_b.json",
    "1_yk.json",
    "20_a.json",
    "2_w.json",
    "3_vo.json",
    "4_u.json",
    "5_t.json",
    "6_s.json",
    "7_r.json",
    "8_p.json",
    "9_n.json",
  ].forEach((name) => {
    const fileName = name.replace(/^\d\d?_/, "").replace(/\.json$/, "");
    for (var i = 0; i < fileName.length; ++i) {
      let letter = fileName[i];
      fileNamesIndex.set(letter, name);
    }
  });
  return fileNamesIndex;
}
