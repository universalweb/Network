(async function () {
  return;
  const distinctProfiles = await thinkyR.table('linkedinContacts')
    .pluck('accountID', 'rootAccount')
    .distinct()
    .run();
  console.log(distinctProfiles);
  const insertProfiles = filter(distinctProfiles, (item) => {
    if (item.rootAccount.includes('-')) {
      return;
    }
    return {
      accountID: item.accountID,
      title: item.rootAccount,
      created: thinkyR.now()
    };
  });
  //console.log(insertProfiles);
  const mapped = [];
  let profileItem,
    subItem,
    itemCheck;

  while (insertProfiles[0]){
    subItem = insertProfiles.shift();
    itemCheck = await thinkyR.table('linkedinProfile')
      .filter({
        accountID: subItem.accountID,
        title: subItem.title,
      })
      .run();
    if(itemCheck.length){
      continue;
    }
    profileItem = await thinkyR.table('linkedinProfile')
      .insert(subItem, {
        returnChanges: true
      })
      .run();
    mapped.push(profileItem.changes[0].new_val);
  }
  each(mapped, (item) => {
    thinkyR.table('linkedinContacts')
      .filter({
        accountID: item.accountID,
        rootAccount: item.title
      })
      .update({
        rootAccount: item.id
      })
      .run();
  });
})();
