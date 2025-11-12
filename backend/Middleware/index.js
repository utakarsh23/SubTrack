const express = require('express');

function jsonParser() {
    return express.json();
}

module.exports = {
    jsonParser
};