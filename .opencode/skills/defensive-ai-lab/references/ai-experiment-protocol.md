# AI Experiment Protocol

## Experiment Definition

Freeze these values before execution:

- Hypothesis and acceptance threshold.
- Prompt template and SHA-256 hash.
- Redacted dataset snapshot and SHA-256 hash.
- Model aliases configured by the user project.
- Temperature, top-p, seed, context, and output-token grid.
- Deterministic assertions and rubric version.
- Maximum runs, tokens, cost, retries, concurrency, and wall time.

## Run Identity

Create a run ID from the canonical JSON hash of model alias, prompt hash, dataset hash, parameter set, and repetition index. Store provider response IDs only after redaction.

## Evaluation Order

1. Parse and schema validity.
2. Required facts and forbidden-content assertions.
3. Task-specific deterministic metrics.
4. Pairwise or rubric judging with blind labels.
5. Human review for subjective output.

Keep the generator and judge identities explicit. Prevent a model from silently judging its own output. Preserve failed and malformed runs in totals.

## Reproducibility

Record software versions, model alias, provider-declared model identifier, parameters, hashes, timestamps, latency, token counts, retry count, and evaluation version. Treat provider model aliases as mutable unless the provider supplies a stable revision.

## Statistical Claims

Report raw counts, central tendency, spread, and sample size. Use paired comparisons when runs share inputs. Label small-sample observations as exploratory. Preserve all exclusions with reasons.

## Cost And Context Guard

Estimate prompt tokens before each batch, reserve output capacity, and stop before the configured context or budget ceiling. Checkpoint after every completed batch. A partial experiment remains reportable with explicit completion percentage.
