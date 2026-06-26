import {
  buildCompleteItems,
  buildOkuriariCompleteItems,
  buildOkurinasiCompleteItems,
} from "./completion.ts";

import { assertEquals } from "@std/assert/equals";

Deno.test({
  name: "buildOkurinasiCompleteItems",
  fn() {
    const items = buildOkurinasiCompleteItems(
      [
        ["い", ["伊"]],
        ["あ", ["亜亜;note", "唖"]],
      ],
      [
        ["亜亜;note", 2],
        ["唖", 5],
      ],
    );

    assertEquals(
      items.map((item) => [item.word, item.abbr, item.info]),
      [
        ["唖", "唖", ""],
        ["亜亜", "亜亜", "note"],
        ["伊", "伊", ""],
      ],
    );
    assertEquals(JSON.parse(items[1].user_data), {
      tag: "skkeleton",
      midasi: "あ",
      word: "亜亜;note",
      type: "okurinasi",
    });
  },
});

Deno.test({
  name: "buildOkuriariCompleteItems",
  async fn() {
    const items = await buildOkuriariCompleteItems("あた", (midasi) => {
      assertEquals(midasi, "あt");
      return Promise.resolve(["当方;hit"]);
    });

    assertEquals(
      items.map((item) => [item.word, item.abbr, item.info]),
      [["当方た", "当方た", "hit"]],
    );
    assertEquals(JSON.parse(items[0].user_data), {
      tag: "skkeleton",
      midasi: "あt",
      word: "当方;hit",
      type: "okuriari",
    });
  },
});

Deno.test({
  name: "buildCompleteItems",
  async fn() {
    const items = await buildCompleteItems(
      [["あ", ["亜"]]],
      [],
      "あた",
      () => Promise.resolve(["当"]),
    );

    assertEquals(
      items.map((item) => item.word),
      ["亜", "当た"],
    );
  },
});

Deno.test({
  name: "buildCompleteItems with preedit prefix",
  async fn() {
    const items = await buildCompleteItems(
      [["あ", ["亜;note"]]],
      [],
      "あた",
      () => Promise.resolve(["当"]),
      "▽あ",
    );

    // word は前方一致用に preedit prefix を含み、abbr は候補のみ
    assertEquals(
      items.map((item) => [item.word, item.abbr]),
      [
        ["▽あ亜", "亜"],
        ["▽あ当た", "当た"],
      ],
    );
  },
});

Deno.test({
  name: "buildOkurinasiCompleteItems with prefix keeps abbr free of prefix",
  fn() {
    const items = buildOkurinasiCompleteItems(
      [["あ", ["亜亜;note", "唖"]]],
      [],
      "▽あ",
    );

    assertEquals(
      items.map((item) => [item.word, item.abbr, item.info]),
      [
        ["▽あ亜亜", "亜亜", "note"],
        ["▽あ唖", "唖", ""],
      ],
    );
  },
});
