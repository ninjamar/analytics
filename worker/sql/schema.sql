DROP TABLE IF EXISTS analytics;

CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY,
    currentTime INTEGER,
    width INTEGER,
    height INTEGER,
    os TEXT,
    browser TEXT,
    isMobile INTEGER,
    isTouchScreen INTEGER,
    referrer TEXT,
    host TEXT,
    port INTEGER,
    pathData TEXT
);