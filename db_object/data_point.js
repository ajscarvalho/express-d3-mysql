"use strict";

class DataPoint {
    constructor(id, timestamp, seriesId, value)
    {
        this.id = id;
        this.ts = timestamp;
        this.data_series_id = seriesId;
        this.value = value;
    }
}

module.exports = DataPoint;
