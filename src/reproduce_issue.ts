
import { addMinutes, differenceInMilliseconds, parseISO } from 'date-fns';

const runTests = () => {
    console.log("Starting tests...");

    try {
        console.log("Test 1: addMinutes with NaN");
        const d = addMinutes(new Date(), NaN);
        console.log("Result:", d);
        console.log("Result string:", d.toString());
        console.log("Result ISO:", d.toISOString()); // expecting throw here
    } catch (e) {
        console.log("Caught in Test 1:", e);
    }

    try {
        console.log("\nTest 2: differenceInMilliseconds with Invalid Date");
        const invalidDate = new Date("invalid");
        const diff = differenceInMilliseconds(invalidDate, new Date());
        console.log("Diff:", diff);
    } catch (e) {
        console.log("Caught in Test 2:", e);
    }

    try {
        console.log("\nTest 3: parseISO with invalid string");
        const d = parseISO("invalid-date-string");
        console.log("Parsed:", d);
        const diff = differenceInMilliseconds(d, new Date());
        console.log("Diff:", diff);
    } catch (e) {
        console.log("Caught in Test 3:", e);
    }
};

runTests();
