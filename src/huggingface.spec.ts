import { expect, test } from "vitest";
import { parseUrl } from "./huggingface";

test.for([[""], ["abc"]])("non-url string '%s' throws an error", ([key]) => {
  expect(() => parseUrl(key)).to.throw();
});

test.for([["ftp:"], ["email:"]])("'%s' scheme throws an error", ([scheme]) => {
  expect(() => parseUrl(`${scheme}//abc`)).to.throw();
});

test.for([["https://some.url"], ["https://some.url/with/a/path"]])(
  "non-huggingface URL returns a NonHfUrl: %s",
  ([key]) => {
    expect(parseUrl(key)).toEqual({ kind: "non-hf", key });
  }
);

test.for([
  ["https://huggingface.co"],
  ["https://hf.co"],
  ["https://huggingface.co/"],
  ["https://huggingface.co/datasets"],
  ["https://huggingface.co/datasets/"],
])("base huggingface URL returns a BaseUrl: %s", ([key]) => {
  expect(parseUrl(key)).toEqual({ kind: "base", key });
});

test.for([
  ["https://huggingface.co/datasets/namespace/repo", "namespace", "repo"],
  ["https://huggingface.co/datasets/namespace/repo/", "namespace", "repo"],
  ["https://huggingface.co/datasets/namespace/123", "namespace", "123"],
])("dataset repo URL returns a RepoUrl: %s", ([key, namespace, repo]) => {
  expect(parseUrl(key)).toEqual({ kind: "repo", namespace, repo, key });
});

test.for([
  [
    "https://huggingface.co/datasets/namespace/repo/tree/branch",
    "namespace",
    "repo",
    "branch",
    "",
  ],
  [
    "https://huggingface.co/datasets/namespace/repo/tree/branch/",
    "namespace",
    "repo",
    "branch",
    "",
  ],
  [
    "https://huggingface.co/datasets/namespace/repo/tree/refs%2Fconvert%2Fparquet",
    "namespace",
    "repo",
    "refs%2Fconvert%2Fparquet",
    "",
  ],
  [
    "https://huggingface.co/datasets/namespace/repo/tree/refs%2Fpr%2F9",
    "namespace",
    "repo",
    "refs%2Fpr%2F9",
    "",
  ],
  [
    "https://huggingface.co/datasets/namespace/repo/tree/branch/folder",
    "namespace",
    "repo",
    "branch",
    "/folder",
  ],
  [
    "https://huggingface.co/datasets/namespace/repo/tree/branch/a/b/c/",
    "namespace",
    "repo",
    "branch",
    "/a/b/c",
  ],
  [
    "https://huggingface.co/datasets/namespace/repo/tree/branch/folder.parquet",
    "namespace",
    "repo",
    "branch",
    "/folder.parquet",
  ],
])(
  "tree repo URL with a branch and an optional path returns a FolderUrl: %s",
  ([key, namespace, repo, branch, path]) => {
    expect(parseUrl(key)).toEqual({
      kind: "folder",
      namespace,
      repo,
      key,
      branch,
      path,
    });
  }
);

test.for([
  [
    "https://huggingface.co/datasets/namespace/repo/blob/branch/file",
    "namespace",
    "repo",
    "branch",
    "/file",
  ],
  [
    "https://huggingface.co/datasets/namespace/repo/blob/branch/path/to/file",
    "namespace",
    "repo",
    "branch",
    "/path/to/file",
  ],
  [
    "https://huggingface.co/datasets/namespace/repo/blob/refs%2Fconvert%2Fparquet/file",
    "namespace",
    "repo",
    "refs%2Fconvert%2Fparquet",
    "/file",
  ],
  [
    "https://huggingface.co/datasets/namespace/repo/blob/branch/file.parquet",
    "namespace",
    "repo",
    "branch",
    "/file.parquet",
  ],
])(
  "blob repo URL with a branch and a path returns a FileUrl: %s",
  ([key, namespace, repo, branch, path]) => {
    expect(parseUrl(key)).toEqual({
      kind: "file",
      namespace,
      repo,
      key,
      branch,
      path,
    });
  }
);

test.for([
  [
    "https://huggingface.co/datasets/namespace/repo/resolve/branch/file",
    "namespace",
    "repo",
    "branch",
    "/file",
  ],
  [
    "https://huggingface.co/datasets/namespace/repo/resolve/branch/file?download=true",
    "namespace",
    "repo",
    "branch",
    "/file",
  ],
  [
    "https://huggingface.co/datasets/namespace/repo/resolve/branch/path/to/file",
    "namespace",
    "repo",
    "branch",
    "/path/to/file",
  ],
  [
    "https://huggingface.co/datasets/namespace/repo/resolve/refs%2Fconvert%2Fparquet/file",
    "namespace",
    "repo",
    "refs%2Fconvert%2Fparquet",
    "/file",
  ],
  [
    "https://huggingface.co/datasets/namespace/repo/resolve/branch/file.parquet",
    "namespace",
    "repo",
    "branch",
    "/file.parquet",
  ],
])(
  "resolve repo URL with a branch and a path returns a FileUrl: %s",
  ([key, namespace, repo, branch, path]) => {
    expect(parseUrl(key)).toEqual({
      kind: "file",
      namespace,
      repo,
      key,
      branch,
      path,
    });
  }
);

test.for([
  ["https://huggingface.co/not-supported"],
  ["https://huggingface.co/not/supported"],
  ["https://huggingface.co/tasks"],
  ["https://huggingface.co/models"],
  ["https://huggingface.co/spaces"],
  ["https://huggingface.co/datasets/canonical-dataset"],
  ["https://huggingface.co/datasets/canonical-dataset/"],
  ["https://huggingface.co/datasets/namespace/repo/branch"],
  ["https://huggingface.co/datasets/namespace/repo/tree"],
  ["https://huggingface.co/datasets/namespace/repo/tree/"],
  ["https://huggingface.co/datasets/namespace/repo/tree/refs/convert/parquet"],
  ["https://huggingface.co/datasets/namespace/repo/blob"],
  ["https://huggingface.co/datasets/namespace/repo/blob/"],
  ["https://huggingface.co/datasets/namespace/repo/blob/branch"],
  ["https://huggingface.co/datasets/namespace/repo/blob/branch/"],
  ["https://huggingface.co/datasets/namespace/repo/blob/branch/file/"],
  ["https://huggingface.co/datasets/namespace/repo/resolve"],
  ["https://huggingface.co/datasets/namespace/repo/resolve/"],
  ["https://huggingface.co/datasets/namespace/repo/resolve/branch"],
  ["https://huggingface.co/datasets/namespace/repo/resolve/branch/"],
  ["https://huggingface.co/datasets/namespace/repo/resolve/branch/file/"],
])("unrelated huggingface URL throws and error: %s", ([key]) => {
  expect(() => parseUrl(key)).to.throw();
});
