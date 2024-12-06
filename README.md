# View Parquet files on Hugging Face

This app allows you to view any file hosted in a Hugging Face dataset. You can search for a dataset, browse its files, and view them as:
- a table if the file is Parquet
- an image if the file is an image
- an HTML page if the file is Markdown
- plain text otherwise.

It's particularly useful to view Parquet files.

You can login with your Hugging Face account to view private datasets.

The app is static and is currently deployed with a [GitHub Action](./github/workflows/ci.yml) to a Hugging Face space: https://huggingface.co/spaces/hyperparam/hyperparam.

Created with `npm create vite@latest parquet-viewer -- --template react-ts`. See https://blog.rednegra.net/2024/10/14/create-a-static-huggingface-space-with-react.
