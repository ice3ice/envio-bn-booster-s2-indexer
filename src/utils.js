const taskTimestamps = {
  task1EndTime: 1766698890,
  task2EndTime: 1766699490,
  task3EndTime: 1766700090,
  task4EndTime: 1766700690,
}

const getTaskCompleted = (timestamp) => {
  if(timestamp <= taskTimestamps.task1EndTime) {
    return {
      task1Completed: true,
      task2Completed: false,
      task3Completed: false,
      task4Completed: false,
    }
  } else if(timestamp > taskTimestamps.task1EndTime && timestamp <= taskTimestamps.task2EndTime) {
    return {
      task1Completed: false,
      task2Completed: true,
      task3Completed: false,
      task4Completed: false,
    }
  } else if(timestamp > taskTimestamps.task2EndTime && timestamp <= taskTimestamps.task3EndTime) {
    return {
      task1Completed: false,
      task2Completed: false,
      task3Completed: true,
      task4Completed: false,
    }
  } else if(timestamp > taskTimestamps.task3EndTime && timestamp <= taskTimestamps.task4EndTime) {
    return {
      task1Completed: false,
      task2Completed: false,
      task3Completed: false,
      task4Completed: true,
    }
  }

  return {
    task1Completed: false,
    task2Completed: false,
    task3Completed: false,
    task4Completed: false,
  }
}

module.exports = {
  getTaskCompleted,
};