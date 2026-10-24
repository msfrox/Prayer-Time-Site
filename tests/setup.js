// Sri Lanka has no DST and a single official timezone (Asia/Colombo, UTC+5:30).
// pt-core.js relies on the local Date object throughout, so pin the test
// runner's local time to the timezone the site is actually built for —
// otherwise "midnight" / "after Isha" edge cases would be internally
// consistent but not representative of a real user's clock.
process.env.TZ = 'Asia/Colombo';
