-- Custom SQL migration file, put your code below! --
CREATE TRIGGER update_bookmarks_updated_at
AFTER UPDATE ON bookmarks
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE bookmarks SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
--> statement-breakpoint
CREATE VIRTUAL TABLE bookmarks_fts USING fts5(
  title,
  description,
  content='bookmarks',
  content_rowid='id',
  tokenize='unicode61'
);
--> statement-breakpoint
CREATE TRIGGER bookmarks_ai AFTER INSERT ON bookmarks BEGIN
  INSERT INTO bookmarks_fts(rowid, title, description)
  VALUES (new.id, new.title, new.description);
END;
--> statement-breakpoint
CREATE TRIGGER bookmarks_bu BEFORE UPDATE OF title, description ON bookmarks BEGIN
  INSERT INTO bookmarks_fts(bookmarks_fts, rowid, title, description)
  VALUES ('delete', old.id, old.title, old.description);
END;
--> statement-breakpoint
CREATE TRIGGER bookmarks_au AFTER UPDATE OF title, description ON bookmarks BEGIN
  INSERT INTO bookmarks_fts(rowid, title, description)
  VALUES (new.id, new.title, new.description);
END;
--> statement-breakpoint
CREATE TRIGGER bookmarks_bd BEFORE DELETE ON bookmarks BEGIN
  INSERT INTO bookmarks_fts(bookmarks_fts, rowid, title, description)
  VALUES ('delete', old.id, old.title, old.description);
END;
