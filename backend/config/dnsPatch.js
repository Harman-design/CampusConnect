const dns = require('dns');

// Patch resolveSrv and resolveTxt for node DNS compatibility in this environment
const originalResolveSrv = dns.resolveSrv;
dns.resolveSrv = function (name, callback) {
  if (name.includes('cluster0.pa6ukgu.mongodb.net')) {
    callback(null, [
      { name: 'ac-dk1zq8f-shard-00-01.pa6ukgu.mongodb.net', port: 27017, priority: 0, weight: 0 },
      { name: 'ac-dk1zq8f-shard-00-02.pa6ukgu.mongodb.net', port: 27017, priority: 0, weight: 0 },
      { name: 'ac-dk1zq8f-shard-00-00.pa6ukgu.mongodb.net', port: 27017, priority: 0, weight: 0 }
    ]);
    return;
  }
  return originalResolveSrv.apply(this, arguments);
};

if (dns.promises && dns.promises.resolveSrv) {
  const originalPromisesResolveSrv = dns.promises.resolveSrv;
  dns.promises.resolveSrv = async function (name, options) {
    if (name.includes('cluster0.pa6ukgu.mongodb.net')) {
      return [
        { name: 'ac-dk1zq8f-shard-00-01.pa6ukgu.mongodb.net', port: 27017, priority: 0, weight: 0 },
        { name: 'ac-dk1zq8f-shard-00-02.pa6ukgu.mongodb.net', port: 27017, priority: 0, weight: 0 },
        { name: 'ac-dk1zq8f-shard-00-00.pa6ukgu.mongodb.net', port: 27017, priority: 0, weight: 0 }
      ];
    }
    return originalPromisesResolveSrv.apply(this, arguments);
  };
}

const originalResolveTxt = dns.resolveTxt;
dns.resolveTxt = function (name, callback) {
  if (name.includes('cluster0.pa6ukgu.mongodb.net')) {
    callback(null, [['authSource=admin&replicaSet=atlas-6dq2in-shard-0']]);
    return;
  }
  return originalResolveTxt.apply(this, arguments);
};

if (dns.promises && dns.promises.resolveTxt) {
  const originalPromisesResolveTxt = dns.promises.resolveTxt;
  dns.promises.resolveTxt = async function (name, options) {
    if (name.includes('cluster0.pa6ukgu.mongodb.net')) {
      return [['authSource=admin&replicaSet=atlas-6dq2in-shard-0']];
    }
    return originalPromisesResolveTxt.apply(this, arguments);
  };
}
