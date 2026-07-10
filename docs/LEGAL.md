# Legal, trademark, and provenance policy

## Scope

Open Brands contains project code, factual metadata, and third-party brand assets. These categories must not be treated as if they share one license.

This document is an implementation policy, not legal advice.

## Code license

Project-authored code should use the repository's chosen open-source license, expected to remain MIT unless an explicit decision changes it.

## Brand assets

Logos, marks, wordmarks, names, and related identity material remain the intellectual property and trademarks of their respective owners.

Inclusion means only that Open Brands provides a technical reference copy. It does not mean:

- Open Brands owns the asset;
- the brand owner endorses Open Brands;
- the asset is freely licensed;
- every downstream use is legally permitted;
- the asset may be altered;
- the brand owner approved the normalized file.

Do not put third-party logos under the project code license.

## Metadata

Names, domains, categories, color values, dimensions, checksums, and source references are handled separately from logo artwork. Before assigning a dataset license, confirm that it accurately reflects rights in compiled metadata and does not purport to license trademarks or third-party artwork.

Until that decision is made, documentation and package metadata must clearly distinguish:

- code license;
- metadata terms;
- third-party asset status.

## Provenance requirements

Every canonical color and asset requires one or more source records. Preferred evidence order:

1. official brand guidelines;
2. official downloadable brand asset;
3. official website or application asset;
4. trademark registry evidence;
5. reputable community reference with cross-checking;
6. legacy repository import.

A legacy repository alone cannot produce `verified` status.

## Source capture

Record:

- source URL;
- source type;
- page or resource title;
- publisher or brand owner;
- access date;
- relevant usage notes;
- whether the file was downloaded directly or reconstructed;
- checksum of a downloaded original when practical.

Do not store access credentials, session URLs, or expiring private download links.

## Modification policy

Allowed deterministic technical cleanup may include:

- removing editor metadata;
- removing comments and unused definitions;
- normalizing XML syntax;
- adding a correct viewBox when this does not alter geometry;
- removing unsafe markup;
- optimizing path serialization without visual change.

Do not:

- redraw or simplify a logo without recording it as a reconstruction;
- alter proportions;
- recolor full-color assets;
- remove trademark symbols automatically;
- force clear-space changes;
- merge separate official assets into a new unofficial lockup;
- imply an altered asset is official.

## Website disclaimer

The website must display a clear global disclaimer and repeat relevant status on brand pages. The wording should state that assets are provided for reference and developer convenience, remain owned by their respective rights holders, and require users to follow applicable brand guidelines and law.

## Takedown and correction process

Provide a visible process for brand owners and representatives to request:

- removal;
- replacement with an official asset;
- metadata correction;
- source correction;
- historical classification;
- usage-note addition.

A request should capture claimant identity, relationship to the brand, affected IDs/assets, requested action, and supporting evidence. Do not publish personal claimant details.

Urgent credible claims may set a record to `disputed` and remove public asset delivery while review continues.

## Disputed content

When an asset or color is disputed:

- mark it explicitly;
- stop returning it as a default;
- optionally retain its checksum and audit history privately or in git history;
- document the resolution in the pull request or issue;
- avoid public speculation.

## Historical assets

Historical logos can be useful but must be clearly separated from current defaults, dated where verified, and sourced. Historical availability does not imply permission to use them commercially.

## Contributions

Contributors must state the source of submitted assets and should not upload files obtained through confidential brand portals or terms that prohibit redistribution. Contribution templates must request provenance and confirm that the contributor is not claiming ownership on behalf of Open Brands.

## API and package representation

Public responses should expose:

- review status;
- source links where appropriate;
- asset current/historical status;
- usage notes;
- a concise trademark disclaimer URL.

Do not expose a misleading `license: MIT` field on third-party assets.
