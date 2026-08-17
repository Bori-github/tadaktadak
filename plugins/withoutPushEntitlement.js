const { withEntitlementsPlist } = require("expo/config-plugins");

// 로컬 알림에는 불필요. 무료 Personal Team이 Push Notifications를 지원하지 않아 서명 거부
module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults["aps-environment"];
    return config;
  });
};
