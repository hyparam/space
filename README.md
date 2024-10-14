# View Parquet files on Hugging Face

This app allows you to view Parquet files hosted in a Hugging Face dataset. It hardcoded for now: https://huggingface.co/datasets/codeparrot/github-code/resolve/main/data/train-00000-of-01126.parquet

The app is static and is currently deployed with a [GitHub Action](./github/workflows/ci.yml) to a Hugging Face space: https://huggingface.co/spaces/severo/parquet-viewer.