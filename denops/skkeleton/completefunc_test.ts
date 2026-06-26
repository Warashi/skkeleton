import { test } from "./testutil.ts";

import type { Denops } from "@denops/std";
import { assertEquals } from "@std/assert/equals";

// 補完候補末尾にカーソルを置いた状態を作る。
// バッファには番兵文字 "|" を置き、その直前（挿入語の直後）にカーソルを移動することで
// 「確定直後にカーソルがある」状態を再現する。
async function placeCursorAfter(
  denops: Denops,
  before: string,
  word: string,
): Promise<void> {
  await denops.call("setline", 1, before + word + "|");
  const col = (await denops.call("strlen", before + word) as number) + 1;
  await denops.call("cursor", 1, col);
}

// Vim の autocomplete は、補完候補のテキストが補完対象（preedit）と前方一致しない
// 場合に候補先頭の1文字を欠落させる。これを避けるため補完候補の word は preedit を
// prefix として持ち、確定後に skkeleton#strip_completed_prefix で prefix を取り除く。
test({
  mode: "all",
  name:
    "strip_completed_prefix removes the preedit prefix from the inserted word",
  async fn(denops: Denops) {
    await placeCursorAfter(denops, "", "▽かんじ漢字");
    await denops.call(
      "skkeleton#strip_completed_prefix",
      "▽かんじ漢字",
      "漢字",
    );

    assertEquals(await denops.call("getline", 1), "漢字|");
    assertEquals(
      await denops.call("col", "."),
      (await denops.call("strlen", "漢字") as number) + 1,
    );
  },
});

test({
  mode: "all",
  name: "strip_completed_prefix preserves text before the completion",
  async fn(denops: Denops) {
    await placeCursorAfter(denops, "abc", "▽あ愛");
    await denops.call("skkeleton#strip_completed_prefix", "▽あ愛", "愛");

    assertEquals(await denops.call("getline", 1), "abc愛|");
  },
});

test({
  mode: "all",
  name:
    "strip_completed_prefix leaves only the candidate for a short candidate",
  async fn(denops: Denops) {
    await placeCursorAfter(denops, "", "▽あい愛");
    await denops.call("skkeleton#strip_completed_prefix", "▽あい愛", "愛");

    assertEquals(await denops.call("getline", 1), "愛|");
  },
});

test({
  mode: "all",
  name: "strip_completed_prefix is a no-op when word equals abbr",
  async fn(denops: Denops) {
    await placeCursorAfter(denops, "", "漢字");
    await denops.call("skkeleton#strip_completed_prefix", "漢字", "漢字");

    assertEquals(await denops.call("getline", 1), "漢字|");
  },
});

test({
  mode: "all",
  name: "strip_completed_prefix is a no-op when the buffer does not match",
  async fn(denops: Denops) {
    await denops.call("setline", 1, "別の文字列");
    await denops.call(
      "cursor",
      1,
      (await denops.call("strlen", "別の文字列") as number) + 1,
    );
    await denops.call(
      "skkeleton#strip_completed_prefix",
      "▽かんじ漢字",
      "漢字",
    );

    assertEquals(await denops.call("getline", 1), "別の文字列");
  },
});
