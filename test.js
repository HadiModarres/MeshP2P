function hello(callback) {
    callback();
}

class Test {
   constructor(){
   }

   test(){
       hello( () =>{
           this.hello2();
       });
   }

   hello2(){
       console.log("hello2");
   }
}

new Test().test();
