-- SCL files are identified by content hash as well as filename (operators re-upload renamed exports).
ALTER TABLE scl_import ADD COLUMN checksum_sha256 VARCHAR(64);
UPDATE scl_import SET checksum_sha256 = '62d23bf2ac0fce65a65581693d4aff1c17d16d59a3a007a3f5f9ebab2041311e' WHERE id = 1;
UPDATE scl_import SET checksum_sha256 = 'a07c46542286d4f518d9c0177a8708f18296c038a6c53f598a953e0fe39c6dbe' WHERE id = 2;
UPDATE scl_import SET checksum_sha256 = '45217ed4a1f8f03c14524f535f3e322c21068488dd6716289e0318c6b56de069' WHERE id = 3;
UPDATE scl_import SET checksum_sha256 = '1057bc6c6f7cbda26c64dc679868278ab5820cb2e13fc1ff798552a7c7a89d35' WHERE id = 4;
UPDATE scl_import SET checksum_sha256 = 'd6f6d6d6bf8dca74a1be25b055d67bcda4b989c42a5c9a5baedc34ad3aec2a06' WHERE id = 5;
UPDATE scl_import SET checksum_sha256 = 'b6bb4528a9f713f335a3c250021fef053454b72d86472fc7a78f0cd1d1b65377' WHERE id = 6;
UPDATE scl_import SET checksum_sha256 = '47196fefbf0c3c4ca02562460ef7a9651e5ed480f17612725b2c090e1a68242a' WHERE id = 7;
