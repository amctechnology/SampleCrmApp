import { Bridge } from '@amc/applicationangularframework';

class MyBridge extends Bridge {

    constructor() {
        super();
        this.appName = 'Salesforce';
        this.initialize();
    }

    async screenpopHandler(event): Promise<any> {
        return null;
    }
}

const tmp = new MyBridge();
