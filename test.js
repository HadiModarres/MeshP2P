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
let a = [3,2,7,0];
a.splice(1, 0, 80);
console.log(a);
console.log(a.slice(0, a.length));
