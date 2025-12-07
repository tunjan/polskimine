
import { addMinutes, differenceInMilliseconds, parseISO } from 'date-fns';

const runTests = () => {

    try {
        const d = addMinutes(new Date(), NaN);
    } catch (e) {
    }

    try {
        const invalidDate = new Date("invalid");
        const diff = differenceInMilliseconds(invalidDate, new Date());
    } catch (e) {
    }

    try {
        const d = parseISO("invalid-date-string");
        const diff = differenceInMilliseconds(d, new Date());
    } catch (e) {
    }
};

runTests();
