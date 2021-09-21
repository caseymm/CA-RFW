# CA RFW

### This action:
- pulls the latest data from the National Weather service
- determine whether or not counties are in CA
- uploads the data to s3
  - if data is new, the action:
    - takes a screenshot via [mbx-devour](https://github.com/caseymm/mbx-devour)
    - tweets a screenshot (or an update saying the watch/warning has been removed)

### How to run
`yarn run-script`

*There is no build action since this script is being run by github actions
