'use strict';

import {reject, filter, each, map, includes, isEmpty} from 'lodash';

module.exports = {
  type: 'DelayedJobs',
  deps: ['DefinePlugin', 'StateMutator', 'Logger'],
  func: function (define, mutate, logger) {
    var newJobs = [];
    var toCancel = [];
    var jobNames = [];

    function tick(jobs, delta) {
      return map(jobs, function subtractDeltaFromDuration (job) {
        if (job.duration === Infinity) {
          return job;
        }

        job.duration -= delta;
        return job;
      });
    }

    function ready (job) {
      return job.duration <= 0 && job.duration !== Infinity;
    }

    function cancelled (job) {
      return includes(toCancel, job.key);
    }

    function devuxAddKeyToList (key) {
      if (includes(jobNames, key)) {
        return;
      }

      jobNames.push(key);
    }

    function devuxCheckJobName (job) {
      if (includes(jobNames, job.key)) {
        return;
      }

      logger().warn({job: job}, 'Can\'t cancel job as it has never been added. Are you sure the job name is spelt correctly?');
    }

    define()('OnPhysicsFrame', function DelayedJobs () {
      return function tickActiveJobs (delta, state) {
        var jobs = state.get('ensemble.jobs');
        var saveId = state.get('ensemble.saveId');

        function callOnCompleteHandlerForReadyJobs (job) {
          logger().info(job, 'Job Ready');

          mutate()(saveId, job.callback(state));
        }

        jobs = jobs.concat(newJobs);
        each(filter(jobs, cancelled), devuxCheckJobName);
        jobs = reject(jobs, cancelled);
        jobs = tick(jobs, delta);

        each(filter(jobs, ready), callOnCompleteHandlerForReadyJobs);

        newJobs = [];
        toCancel = [];

        let jobsToSave = reject(jobs, ready);
        if (isEmpty(state.get('ensemble.jobs')) && isEmpty(jobsToSave)) {
          return;
        }

        return ['ensemble.jobs', jobsToSave];
      };
    });

    function add (key, duration, callback) {
      newJobs.push({ key, duration, callback });
      devuxAddKeyToList(key);
    }

    function cancelAll (key) {
      toCancel.push(key);
    }

    return {
      add: add,
      cancelAll: cancelAll
    };
  }
};