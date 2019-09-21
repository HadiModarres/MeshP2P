function hello(callback) {
    callback();
}

class Test {
   constructor(){
   }
   test2(){
       const a = [];
       a.push("a1");
       console.log(a);
   }

   test(){
       let entries = [4];
       let a = [1, 2, 3];
       entries.push(...a);
       console.info(entries);
   }

   hello2(){
       console.log("hello2");
   }
}

// new Test().test();
let a=undefined;
console.log(!a && a!==0);
