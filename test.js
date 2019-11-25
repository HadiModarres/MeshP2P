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

// console.log(new Date().getTime()/1000);

let a = new Date().getTime()/1000;

console.log(1569569502.117 -1569569499.472 >1 );
console.log(5.007999897003174 - 1> 1);
setTimeout(()=>{
   console.log((new Date().getTime()/1000)-a);
},5000);

// new Test().test();
// let a = [3,2,7,0];
// a.splice(1, 0, 80);
// console.log(a);
// console.log(a.slice(0, a.length));

let {x,y=10} = {x:3}
console.log(y);
