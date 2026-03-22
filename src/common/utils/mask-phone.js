"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskPhone = maskPhone;
function maskPhone(phone) {
    if (!phone || phone.length < 8)
        return phone !== null && phone !== void 0 ? phone : null;
    var start = phone.slice(0, Math.min(6, phone.length - 4));
    return "".concat(start, "** **");
}
